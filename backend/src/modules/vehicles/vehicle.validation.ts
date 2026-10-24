
import { z } from 'zod';


const priceSchema = z
  .coerce
  .number()
  .finite()
  .positive('Price must be greater than zero')
  .max(9_999_999_999.99, 'Price exceeds the maximum allowed value')
  .refine(
    (value) =>
      Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
    'Price must have at most two decimal places',
  );


const makeSchema = z.string().trim().min(1).max(100);
const modelSchema = z.string().trim().min(1).max(80);
const categorySchema = z.string().trim().min(1).max(50);
const quantitySchema = z.number().int().min(0).max(1_000_000);

export const createVehicleSchema = z
  .object({
    make: makeSchema,
    model: modelSchema,
    category: categorySchema,
    price: priceSchema,
    quantity: quantitySchema,
  })
  .strict();

export const updateVehicleSchema = z
  .object({
    make: makeSchema.optional(),
    model: modelSchema.optional(),
    category: categorySchema.optional(),
    price: priceSchema.optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one vehicle detail must be provided',
  );

export const vehicleSearchSchema = z
  .object({
    q: z.string().trim().max(100).optional(),
    make: z.string().trim().max(100).optional(),
    model: z.string().trim().max(100).optional(),
    category: z.string().trim().max(50).optional(),
    minPrice: z.coerce.number().finite().min(0).optional(),
    maxPrice: z.coerce.number().finite().min(0).optional(),
    inStock: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine(
    (value) =>
      value.minPrice === undefined ||
      value.maxPrice === undefined ||
      value.minPrice <= value.maxPrice,
    {
      message: 'minPrice cannot exceed maxPrice',
      path: ['minPrice'],
    },
  );

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleSearchInput = z.infer<typeof vehicleSearchSchema>;
