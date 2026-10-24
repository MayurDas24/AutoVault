import type { CreateVehicleInput, UpdateVehicleInput, Vehicle } from '../../lib/api/types'

export const MAX_STOCK = 1_000_000
const MAX_PRICE = 9_999_999_999.99
const PRICE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/
const WHOLE_NUMBER = /^\d+$/

export interface VehicleFormValues {
  make: string
  model: string
  category: string
  price: string
  quantity: string
}

export type VehicleFormErrors = Partial<Record<keyof VehicleFormValues, string>>

export const emptyVehicleForm: VehicleFormValues = {
  make: '',
  model: '',
  category: '',
  price: '',
  quantity: '',
}

export const vehicleFieldOrder: ReadonlyArray<keyof VehicleFormValues> = [
  'make',
  'model',
  'category',
  'price',
  'quantity',
]

function checkText(label: string, value: string, max: number): string | undefined {
  const text = value.trim()

  if (!text) return `Enter the ${label.toLowerCase()}.`
  if (text.length > max) return `${label} must be ${max} characters or fewer.`
  return undefined
}

// Mirrors the backend rules in vehicle.validation.ts; the API still re-validates.
export function validateVehicleForm(
  values: VehicleFormValues,
  mode: 'create' | 'edit',
): VehicleFormErrors {
  const errors: VehicleFormErrors = {}

  const make = checkText('Make', values.make, 100)
  if (make) errors.make = make

  const model = checkText('Model', values.model, 80)
  if (model) errors.model = model

  const category = checkText('Category', values.category, 50)
  if (category) errors.category = category

  const price = values.price.trim()
  if (!price) {
    errors.price = 'Enter a price.'
  } else if (!PRICE_PATTERN.test(price)) {
    errors.price = 'Enter a valid price with at most two decimal places.'
  } else if (Number(price) <= 0) {
    errors.price = 'Price must be greater than zero.'
  } else if (Number(price) > MAX_PRICE) {
    errors.price = 'Price is too large.'
  }

  if (mode === 'create') {
    const quantity = values.quantity.trim()
    if (!quantity) {
      errors.quantity = 'Enter the starting stock.'
    } else if (!WHOLE_NUMBER.test(quantity)) {
      errors.quantity = 'Enter a whole number.'
    } else if (Number(quantity) > MAX_STOCK) {
      errors.quantity = `Stock cannot exceed ${MAX_STOCK.toLocaleString('en-US')}.`
    }
  }

  return errors
}

export function toCreateInput(values: VehicleFormValues): CreateVehicleInput {
  return {
    make: values.make.trim(),
    model: values.model.trim(),
    category: values.category.trim(),
    price: Number(values.price.trim()),
    quantity: Number(values.quantity.trim()),
  }
}

/** Only changed details are sent. Quantity is never part of an update. */
export function getVehicleChanges(
  vehicle: Vehicle,
  values: VehicleFormValues,
): UpdateVehicleInput {
  const changes: UpdateVehicleInput = {}
  const price = Number(values.price.trim())

  if (values.make.trim() !== vehicle.make) changes.make = values.make.trim()
  if (values.model.trim() !== vehicle.model) changes.model = values.model.trim()
  if (values.category.trim() !== vehicle.category) changes.category = values.category.trim()
  if (price !== Number(vehicle.price)) changes.price = price

  return changes
}

export type RestockCheck = { ok: true; quantity: number } | { ok: false; error: string }

export function validateRestock(value: string): RestockCheck {
  const text = value.trim()

  if (!text) return { ok: false, error: 'Enter how many units to add.' }
  if (!WHOLE_NUMBER.test(text) || Number(text) < 1) {
    return { ok: false, error: 'Enter a whole number of at least 1.' }
  }
  if (Number(text) > MAX_STOCK) {
    return { ok: false, error: `You can add at most ${MAX_STOCK.toLocaleString('en-US')} units at once.` }
  }

  return { ok: true, quantity: Number(text) }
}