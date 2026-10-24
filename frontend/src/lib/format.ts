/** The API returns prices without a currency; change this one constant if needed. */
export const CURRENCY = 'USD'

/** The backend defines no low-stock threshold, so the UI uses this one. */
export const LOW_STOCK_THRESHOLD = 5

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: CURRENCY,
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Formats the API's decimal price string for display. */
export function formatPrice(price: string): string {
  const value = Number(price)
  return Number.isFinite(value) ? priceFormatter.format(value) : price
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateFormatter.format(date)
}

export function formatUnits(quantity: number): string {
  return `${quantity.toLocaleString('en-US')} ${quantity === 1 ? 'unit' : 'units'}`
}

export type StockLevel = 'in' | 'low' | 'out'

export interface StockStatus {
  level: StockLevel
  label: string
}

export function getStockStatus(quantity: number): StockStatus {
  if (quantity <= 0) return { level: 'out', label: 'Out of stock' }
  if (quantity <= LOW_STOCK_THRESHOLD) return { level: 'low', label: 'Low stock' }
  return { level: 'in', label: 'In stock' }
}