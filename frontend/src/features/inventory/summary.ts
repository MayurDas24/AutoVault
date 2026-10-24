import { useQuery } from '@tanstack/react-query'
import { listVehicles } from '../../lib/api/endpoints'
import type { Vehicle } from '../../lib/api/types'
import { LOW_STOCK_THRESHOLD, formatPrice } from '../../lib/format'
import { vehicleKeys } from './queries'

const PAGE_SIZE = 100
const MAX_PAGES = 20
const RECENT_COUNT = 5

export interface InventorySummary {
  /** Number of distinct vehicles (makes/models) in the catalogue. */
  totalModels: number
  /** Sum of all quantities across loaded vehicles. */
  totalUnits: number
  /** Formatted currency string. */
  inventoryValue: string
  lowStock: number
  outOfStock: number
  /** Newest vehicles first. */
  recent: Vehicle[]
  loadedCount: number
  /** True when the catalogue is larger than the pages we load for the summary. */
  truncated: boolean
}

function toCents(price: string): bigint {
  return BigInt(Math.round(Number(price) * 100))
}

function centsToPrice(cents: bigint): string {
  const fraction = (cents % 100n).toString().padStart(2, '0')
  return `${cents / 100n}.${fraction}`
}

export function summarizeInventory(
  vehicles: readonly Vehicle[],
  totalModels: number,
  truncated: boolean,
): InventorySummary {
  let totalUnits = 0
  let valueInCents = 0n
  let lowStock = 0
  let outOfStock = 0

  for (const vehicle of vehicles) {
    totalUnits += vehicle.quantity
    valueInCents += toCents(vehicle.price) * BigInt(vehicle.quantity)

    if (vehicle.quantity <= 0) outOfStock += 1
    else if (vehicle.quantity <= LOW_STOCK_THRESHOLD) lowStock += 1
  }

  const recent = [...vehicles]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, RECENT_COUNT)

  return {
    totalModels,
    totalUnits,
    inventoryValue: formatPrice(centsToPrice(valueInCents)),
    lowStock,
    outOfStock,
    recent,
    loadedCount: vehicles.length,
    truncated,
  }
}

async function loadInventorySummary(signal: AbortSignal): Promise<InventorySummary> {
  const first = await listVehicles({ page: 1, limit: PAGE_SIZE }, signal)
  const vehicles = [...first.vehicles]
  const { totalPages, total } = first.pagination
  const lastPage = Math.min(totalPages, MAX_PAGES)

  for (let page = 2; page <= lastPage; page += 1) {
    const next = await listVehicles({ page, limit: PAGE_SIZE }, signal)
    vehicles.push(...next.vehicles)
  }

  return summarizeInventory(vehicles, total, totalPages > MAX_PAGES)
}

/** The API has no stats endpoint, so the summary is computed from the full list. */
export function useInventorySummary() {
  return useQuery({
    queryKey: vehicleKeys.summary(),
    queryFn: ({ signal }) => loadInventorySummary(signal),
  })
}