import type { VehicleQuery } from '../../lib/api/types'

export const PAGE_SIZE = 10

export interface InventoryFilters {
  q: string
  category: string
  minPrice: string
  maxPrice: string
  inStock: boolean
}

export const emptyFilters: InventoryFilters = {
  q: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
}

export function readFilters(params: URLSearchParams): InventoryFilters {
  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    minPrice: params.get('minPrice') ?? '',
    maxPrice: params.get('maxPrice') ?? '',
    inStock: params.get('inStock') === 'true',
  }
}

export function readPage(params: URLSearchParams): number {
  const page = Number(params.get('page'))
  return Number.isInteger(page) && page >= 1 ? page : 1
}

export function toSearchParams(filters: InventoryFilters, page: number): URLSearchParams {
  const params = new URLSearchParams()
  const q = filters.q.trim()
  const category = filters.category.trim()
  const minPrice = filters.minPrice.trim()
  const maxPrice = filters.maxPrice.trim()

  if (q) params.set('q', q)
  if (category) params.set('category', category)
  if (minPrice) params.set('minPrice', minPrice)
  if (maxPrice) params.set('maxPrice', maxPrice)
  if (filters.inStock) params.set('inStock', 'true')
  if (page > 1) params.set('page', String(page))

  return params
}

function parsePrice(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const amount = Number(trimmed)
  return Number.isFinite(amount) && amount >= 0 ? amount : undefined
}

export function toVehicleQuery(filters: InventoryFilters, page: number): VehicleQuery {
  return {
    q: filters.q.trim() || undefined,
    category: filters.category.trim() || undefined,
    minPrice: parsePrice(filters.minPrice),
    maxPrice: parsePrice(filters.maxPrice),
    inStock: filters.inStock ? true : undefined,
    page,
    limit: PAGE_SIZE,
  }
}

export function hasActiveFilters(filters: InventoryFilters): boolean {
  return toSearchParams(filters, 1).size > 0
}

export interface FilterErrors {
  minPrice?: string
  maxPrice?: string
}

export function validateFilters(filters: InventoryFilters): FilterErrors {
  const errors: FilterErrors = {}
  const min = filters.minPrice.trim()
  const max = filters.maxPrice.trim()

  if (min && parsePrice(min) === undefined) errors.minPrice = 'Enter a valid amount.'
  if (max && parsePrice(max) === undefined) errors.maxPrice = 'Enter a valid amount.'

  const minValue = parsePrice(min)
  const maxValue = parsePrice(max)

  if (
    !errors.minPrice &&
    !errors.maxPrice &&
    minValue !== undefined &&
    maxValue !== undefined &&
    minValue > maxValue
  ) {
    errors.minPrice = 'Minimum price cannot exceed maximum price.'
  }

  return errors
}