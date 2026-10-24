
import { Prisma } from '@prisma/client';

import { AppError } from '../../shared/errors.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleSearchInput,
} from './vehicle.validation.js';

export type VehicleDatabase = Pick<
  Prisma.TransactionClient,
  'vehicle'
>;

const VEHICLE_SELECT = {
  id: true,
  make: true,
  model: true,
  category: true,
  price: true,
  quantity: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VehicleSelect;

function serializeVehicle<T extends { price: Prisma.Decimal }>(
  vehicle: T,
) {
  return {
    ...vehicle,
    price: vehicle.price.toFixed(2),
  };
}

function isMissingRecord(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

function validateInventoryQuantity(quantity: number, operation: string) {
  if (
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 1_000_000
  ) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      `${operation} quantity must be a positive integer not exceeding 1000000`,
    );
  }
}

export function createVehicleService(database: VehicleDatabase) {
  return {
    async create(input: CreateVehicleInput) {
      const vehicle = await database.vehicle.create({
        data: {
          make: input.make,
          model: input.model,
          category: input.category,
          price: input.price,
          quantity: input.quantity,
        },
        select: VEHICLE_SELECT,
      });

      return serializeVehicle(vehicle);
    },

    async list(input: VehicleSearchInput) {
      const page = input.page ?? 1;
      const limit = input.limit ?? 20;

      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid pagination parameters',
        );
      }

      const where: Prisma.VehicleWhereInput = {};
      const q = input.q?.trim();

      if (q) {
        where.OR = [
          { make: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ];
      }

      if (input.make) {
        where.make = {
          contains: input.make.trim(),
          mode: 'insensitive',
        };
      }

      if (input.model) {
        where.model = {
          contains: input.model.trim(),
          mode: 'insensitive',
        };
      }

      if (input.category) {
        where.category = {
          contains: input.category.trim(),
          mode: 'insensitive',
        };
      }

      if (
        input.minPrice !== undefined ||
        input.maxPrice !== undefined
      ) {
        where.price = {
          ...(input.minPrice !== undefined
            ? { gte: input.minPrice }
            : {}),
          ...(input.maxPrice !== undefined
            ? { lte: input.maxPrice }
            : {}),
        };
      }

      if (input.inStock !== undefined) {
        where.quantity = input.inStock ? { gt: 0 } : 0;
      }

      const skip = (page - 1) * limit;

      const [records, total] = await Promise.all([
        database.vehicle.findMany({
          where,
          select: VEHICLE_SELECT,
          orderBy: [
            { make: 'asc' },
            { model: 'asc' },
            { id: 'asc' },
          ],
          skip,
          take: limit,
        }),
        database.vehicle.count({ where }),
      ]);

      return {
        vehicles: records.map(serializeVehicle),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async getById(id: string) {
      const vehicle = await database.vehicle.findUnique({
        where: { id },
        select: VEHICLE_SELECT,
      });

      if (!vehicle) {
        throw new AppError(
          404,
          'VEHICLE_NOT_FOUND',
          'Vehicle not found',
        );
      }

      return serializeVehicle(vehicle);
    },

    async update(id: string, input: UpdateVehicleInput) {
      const data: Prisma.VehicleUpdateInput = {};

      if (input.make !== undefined) data.make = input.make;
      if (input.model !== undefined) data.model = input.model;
      if (input.category !== undefined) data.category = input.category;
      if (input.price !== undefined) data.price = input.price;

      if (Object.keys(data).length === 0) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'At least one vehicle detail must be provided',
        );
      }

      try {
        const vehicle = await database.vehicle.update({
          where: { id },
          data,
          select: VEHICLE_SELECT,
        });

        return serializeVehicle(vehicle);
      } catch (error) {
        if (isMissingRecord(error)) {
          throw new AppError(
            404,
            'VEHICLE_NOT_FOUND',
            'Vehicle not found',
          );
        }

        throw error;
      }
    },

    async delete(id: string) {
      try {
        await database.vehicle.delete({ where: { id } });
      } catch (error) {
        if (isMissingRecord(error)) {
          throw new AppError(
            404,
            'VEHICLE_NOT_FOUND',
            'Vehicle not found',
          );
        }

        throw error;
      }
    },

    async purchase(id: string, quantity = 1) {
      validateInventoryQuantity(quantity, 'Purchase');

      const result = await database.vehicle.updateMany({
        where: {
          id,
          quantity: { gte: quantity },
        },
        data: {
          quantity: { decrement: quantity },
        },
      });

      if (result.count === 0) {
        const existing = await database.vehicle.findUnique({
          where: { id },
          select: { id: true },
        });

        if (!existing) {
          throw new AppError(
            404,
            'VEHICLE_NOT_FOUND',
            'Vehicle not found',
          );
        }

        throw new AppError(
          409,
          'OUT_OF_STOCK',
          'Insufficient inventory to complete this purchase',
        );
      }

      const vehicle = await database.vehicle.findUniqueOrThrow({
        where: { id },
        select: VEHICLE_SELECT,
      });

      return serializeVehicle(vehicle);
    },

    async restock(id: string, quantity: number) {
      validateInventoryQuantity(quantity, 'Restock');

      const result = await database.vehicle.updateMany({
        where: { id },
        data: {
          quantity: { increment: quantity },
        },
      });

      if (result.count === 0) {
        throw new AppError(
          404,
          'VEHICLE_NOT_FOUND',
          'Vehicle not found',
        );
      }

      const vehicle = await database.vehicle.findUniqueOrThrow({
        where: { id },
        select: VEHICLE_SELECT,
      });

      return serializeVehicle(vehicle);
    },
  };
}
