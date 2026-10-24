
import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createVehicleService,
  type VehicleDatabase,
} from '../../src/modules/vehicles/vehicle.service.js';

const mocks = vi.hoisted(() => ({
  updateMany: vi.fn(),
  findUnique: vi.fn(),
  findUniqueOrThrow: vi.fn(),
}));

const database = {
  vehicle: {
    updateMany: mocks.updateMany,
    findUnique: mocks.findUnique,
    findUniqueOrThrow: mocks.findUniqueOrThrow,
  },
} as unknown as VehicleDatabase;

const service = createVehicleService(database);

const vehicleRecord = {
  id: 'b74f7ceb-8d01-4bc5-8731-e119ed631831',
  make: 'Toyota',
  model: 'Corolla',
  category: 'Sedan',
  price: new Prisma.Decimal('24500.50'),
  quantity: 4,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('Inventory service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('purchases a vehicle using an atomic inventory decrement', async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUniqueOrThrow.mockResolvedValue({
      ...vehicleRecord,
      quantity: 3,
    });

    const result = await service.purchase(vehicleRecord.id);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: {
        id: vehicleRecord.id,
        quantity: { gte: 1 },
      },
      data: {
        quantity: { decrement: 1 },
      },
    });

    expect(result.quantity).toBe(3);
    expect(result.price).toBe('24500.50');
  });

  it('rejects a purchase when inventory is insufficient', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.findUnique.mockResolvedValue({
      id: vehicleRecord.id,
    });

    await expect(
      service.purchase(vehicleRecord.id),
    ).rejects.toMatchObject({
      status: 409,
      code: 'OUT_OF_STOCK',
    });
  });

  it('returns not found when purchasing a nonexistent vehicle', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.findUnique.mockResolvedValue(null);

    await expect(
      service.purchase(vehicleRecord.id),
    ).rejects.toMatchObject({
      status: 404,
      code: 'VEHICLE_NOT_FOUND',
    });
  });

  it('rejects invalid purchase quantities', async () => {
    await expect(
      service.purchase(vehicleRecord.id, 0),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      service.purchase(vehicleRecord.id, 1.5),
    ).rejects.toMatchObject({ status: 400 });

    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it('restocks inventory using an atomic increment', async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    mocks.findUniqueOrThrow.mockResolvedValue({
      ...vehicleRecord,
      quantity: 9,
    });

    const result = await service.restock(vehicleRecord.id, 5);

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: vehicleRecord.id },
      data: { quantity: { increment: 5 } },
    });

    expect(result.quantity).toBe(9);
    expect(result.price).toBe('24500.50');
  });

  it('returns not found when restocking a nonexistent vehicle', async () => {
    mocks.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      service.restock(vehicleRecord.id, 5),
    ).rejects.toMatchObject({
      status: 404,
      code: 'VEHICLE_NOT_FOUND',
    });
  });

  it('rejects invalid restock quantities', async () => {
    await expect(
      service.restock(vehicleRecord.id, 0),
    ).rejects.toMatchObject({ status: 400 });

    await expect(
      service.restock(vehicleRecord.id, 1.5),
    ).rejects.toMatchObject({ status: 400 });

    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
