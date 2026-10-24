
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { AppError } from '../../shared/errors.js';
import type { createVehicleService } from './vehicle.service.js';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleSearchSchema,
} from './vehicle.validation.js';

type VehicleService = ReturnType<typeof createVehicleService>;

const vehicleIdSchema = z.string().uuid();

const restockSchema = z.object({
  quantity: z.number().int().min(1).max(1_000_000),
});


function parseVehicleId(value: string | string[] | undefined): string {
  if (typeof value !== 'string') {
    throw new AppError(
      400,
      'INVALID_VEHICLE_ID',
      'Vehicle ID must be a valid UUID',
    );
  }

  const result = vehicleIdSchema.safeParse(value);

  if (!result.success) {
    throw new AppError(
      400,
      'INVALID_VEHICLE_ID',
      'Vehicle ID must be a valid UUID',
    );
  }

  return result.data;
}


function requireJson(request: Parameters<RequestHandler>[0]) {
  const mediaType = request
    .get('content-type')
    ?.split(';')[0]
    ?.trim()
    .toLowerCase();

  if (mediaType !== 'application/json') {
    throw new AppError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Content-Type must be application/json',
    );
  }
}

export function createVehicleController(service: VehicleService) {
  const create: RequestHandler = async (request, response) => {
    response.set('Cache-Control', 'no-store');
    requireJson(request);

    const input = createVehicleSchema.parse(request.body);
    const vehicle = await service.create(input);

    response.status(201).json({ vehicle });
  };

  const list: RequestHandler = async (request, response) => {
    response.set('Cache-Control', 'no-store');

    const search = vehicleSearchSchema.parse(request.query);
    const result = await service.list(search);

    response.status(200).json(result);
  };

  const getById: RequestHandler = async (request, response) => {
    response.set('Cache-Control', 'no-store');

    const id = parseVehicleId(request.params.id);
    const vehicle = await service.getById(id);

    response.status(200).json({ vehicle });
  };

  const update: RequestHandler = async (request, response) => {
    response.set('Cache-Control', 'no-store');
    requireJson(request);

    const id = parseVehicleId(request.params.id ?? '');
    const input = updateVehicleSchema.parse(request.body);
    const vehicle = await service.update(id, input);

    response.status(200).json({ vehicle });
  };

  const remove: RequestHandler = async (request, response) => {
    response.set('Cache-Control', 'no-store');

    const id = parseVehicleId(request.params.id ?? '');
    await service.delete(id);

    response.status(204).send();
  };

  const purchase: RequestHandler = async (request, response) => {
    response.set('Cache-Control', 'no-store');

    const id = parseVehicleId(request.params.id ?? '');
    const vehicle = await service.purchase(id);

    response.status(200).json({
      message: 'Vehicle purchased successfully',
      vehicle,
    });
  };

  const restock: RequestHandler = async (request, response) => {
    response.set('Cache-Control', 'no-store');
    requireJson(request);

    const id = parseVehicleId(request.params.id ?? '');
    const input = restockSchema.parse(request.body);
    const vehicle = await service.restock(id, input.quantity);

    response.status(200).json({
      message: 'Vehicle restocked successfully',
      vehicle,
    });
  };

  return {
    create,
    list,
    getById,
    update,
    remove,
    purchase,
    restock,
  };
}
