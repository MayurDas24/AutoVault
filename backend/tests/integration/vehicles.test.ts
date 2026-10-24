import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { database } from '../../src/config/database.js';
import { testUser, withTestApp } from '../helpers/testApp.js';

const endpoint = '/api/vehicles';
const vehicle = () => ({
  make: `Test-${randomUUID()}`, model: 'Roadster', category: 'Sedan', price: '24500.50', quantity: 3,
});

afterAll(() => database.$disconnect());

describe('Vehicle API', () => {
  it.each([
    ['post', endpoint], ['get', endpoint], ['get', `${endpoint}/search`],
    ['put', `${endpoint}/${randomUUID()}`], ['delete', `${endpoint}/${randomUUID()}`],
  ] as const)('requires authentication for %s %s', async (method, path) => {
    await withTestApp(async ({ app }) => {
      expect((await request(app)[method](path).send(method === 'get' ? undefined : vehicle())).status).toBe(401);
    });
  });

  it('creates a vehicle with validated fields and an exact decimal price', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const input = vehicle();
      const response = await request(app).post(endpoint).auth(token, { type: 'bearer' })
        .send({ ...input, model: '  Roadster  ' });
      expect(response.status).toBe(201);
      expect(response.body.vehicle).toMatchObject({ ...input, id: expect.any(String) });
      const stored = await transaction.vehicle.findUniqueOrThrow({ where: { id: response.body.vehicle.id } });
      expect(stored.price.toFixed(2)).toBe('24500.50');
      expect(stored.quantity).toBe(3);
    });
  });

  it.each([
    ['blank make', { make: '  ' }],
    ['missing make', { make: undefined }],
    ['long model', { model: 'a'.repeat(81) }],
    ['non-string category', { category: 123 }],
    ['negative price', { price: -1 }],
    ['zero price', { price: '0' }],
    ['excess price precision', { price: '12.345' }],
    ['price overflow', { price: '10000000000.00' }],
    ['negative quantity', { quantity: -1 }],
    ['fractional quantity', { quantity: 1.5 }],
    ['quantity overflow', { quantity: 2147483648 }],
    ['unknown property', { id: randomUUID() }],
  ])('rejects invalid creation: %s', async (_label, override) => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const response = await request(app).post(endpoint).auth(token, { type: 'bearer' }).send({ ...vehicle(), ...override });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  it('lists vehicles including zero-stock entries', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const stored = await transaction.vehicle.create({ data: { ...vehicle(), quantity: 0 } });
      const response = await request(app).get(endpoint).auth(token, { type: 'bearer' });
      expect(response.status).toBe(200);
      expect(response.body.vehicles).toContainEqual(expect.objectContaining({ id: stored.id, quantity: 0, price: '24500.50' }));
    });
  });

  it('combines case-insensitive make, model, category and inclusive price filters', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const input = vehicle();
      const selected = await transaction.vehicle.create({ data: input });
      await transaction.vehicle.create({ data: { ...input, model: 'Other', price: '25000.00' } });
      const response = await request(app).get(`${endpoint}/search`).auth(token, { type: 'bearer' })
        .query({ make: input.make.toLowerCase(), model: 'ROAD', category: 'sedan', minPrice: '24500.50', maxPrice: '24500.50' });
      expect(response.status).toBe(200);
      expect(response.body.vehicles.map((item: { id: string }) => item.id)).toEqual([selected.id]);
    });
  });

  it('searches across vehicle names and paginates without losing results', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const keyword = `Find-${randomUUID()}`;
      const first = await transaction.vehicle.create({ data: { ...vehicle(), model: keyword } });
      const second = await transaction.vehicle.create({ data: { ...vehicle(), make: keyword } });
      const page1 = await request(app).get(`${endpoint}/search`).auth(token, { type: 'bearer' }).query({ q: keyword, limit: 1 });
      const page2 = await request(app).get(`${endpoint}/search`).auth(token, { type: 'bearer' }).query({ q: keyword, limit: 1, page: 2 });
      expect(page1.status).toBe(200);
      expect(page2.status).toBe(200);
      expect(page1.body.pagination).toEqual({ page: 1, limit: 1, total: 2, totalPages: 2 });
      expect([page1.body.vehicles[0].id, page2.body.vehicles[0].id].sort()).toEqual([first.id, second.id].sort());
    });
  });

  it.each([
    { minPrice: '-1' }, { minPrice: '20', maxPrice: '10' }, { page: '0' },
    { limit: '101' }, { sort: 'untrusted' }, { maxPrice: 'abc' },
  ])('rejects invalid search query %j', async (query) => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const response = await request(app).get(`${endpoint}/search`).auth(token, { type: 'bearer' }).query(query);
      expect(response.status).toBe(400);
    });
  });

  it('updates vehicle details while preserving inventory quantity', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const stored = await transaction.vehicle.create({ data: vehicle() });
      const response = await request(app).put(`${endpoint}/${stored.id}`).auth(token, { type: 'bearer' })
        .send({ model: 'Updated', price: 26500 });
      expect(response.status).toBe(200);
      expect(response.body.vehicle).toMatchObject({ id: stored.id, model: 'Updated', price: '26500.00', quantity: stored.quantity });
      expect((await transaction.vehicle.findUniqueOrThrow({ where: { id: stored.id } })).model).toBe('Updated');
    });
  });

  it.each([{}, { quantity: 100 }, { price: '-1' }])('rejects invalid detail update %j', async (input) => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const stored = await transaction.vehicle.create({ data: vehicle() });
      expect((await request(app).put(`${endpoint}/${stored.id}`).auth(token, { type: 'bearer' }).send(input)).status).toBe(400);
      expect((await transaction.vehicle.findUniqueOrThrow({ where: { id: stored.id } })).quantity).toBe(stored.quantity);
    });
  });

  it('returns 400 for malformed IDs and 404 for missing vehicles', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      expect((await request(app).put(`${endpoint}/not-a-uuid`).auth(token, { type: 'bearer' }).send({ model: 'New' })).status).toBe(400);
      expect((await request(app).put(`${endpoint}/${randomUUID()}`).auth(token, { type: 'bearer' }).send({ model: 'New' })).status).toBe(404);
      expect((await request(app).delete(`${endpoint}/${randomUUID()}`).auth(token, { type: 'bearer' })).status).toBe(404);
    });
  });

  it('forbids normal users from deleting vehicles', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'USER');
      const stored = await transaction.vehicle.create({ data: vehicle() });
      expect((await request(app).delete(`${endpoint}/${stored.id}`).auth(token, { type: 'bearer' })).status).toBe(403);
      expect(await transaction.vehicle.findUnique({ where: { id: stored.id } })).not.toBeNull();
    });
  });

  it('allows an administrator to delete a vehicle', async () => {
    await withTestApp(async ({ app, database: transaction }) => {
      const { token } = await testUser(transaction, 'ADMIN');
      const stored = await transaction.vehicle.create({ data: vehicle() });
      expect((await request(app).delete(`${endpoint}/${stored.id}`).auth(token, { type: 'bearer' })).status).toBe(204);
      expect(await transaction.vehicle.findUnique({ where: { id: stored.id } })).toBeNull();
    });
  });
});
