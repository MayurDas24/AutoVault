import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { getVehicle, listVehicles, purchaseVehicle } from '../../lib/api/endpoints'
import type { VehicleQuery, VehicleResponse } from '../../lib/api/types'

export const vehicleKeys = {
  all: ['vehicles'] as const,
  lists: () => [...vehicleKeys.all, 'list'] as const,
  list: (query: VehicleQuery) => [...vehicleKeys.lists(), query] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
  summary: () => [...vehicleKeys.all, 'summary'] as const,
}

/** Refreshes every list and the dashboard summary after inventory changes. */
export async function invalidateVehicleLists(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() }),
    queryClient.invalidateQueries({ queryKey: vehicleKeys.summary() }),
  ])
}

export function useVehicles(query: VehicleQuery) {
  return useQuery({
    queryKey: vehicleKeys.list(query),
    queryFn: ({ signal }) => listVehicles(query, signal),
    placeholderData: keepPreviousData,
  })
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: vehicleKeys.detail(id),
    queryFn: ({ signal }) => getVehicle(id, signal),
    enabled: id.length > 0,
  })
}

/**
 * Purchases one unit. Stock shown afterwards always comes from the server's
 * response; nothing is updated optimistically.
 */
export function usePurchaseVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => purchaseVehicle(id),
    onSuccess: async (result: VehicleResponse) => {
      queryClient.setQueryData(vehicleKeys.detail(result.vehicle.id), result.vehicle)
      await invalidateVehicleLists(queryClient)
    },
    // e.g. someone else bought the last unit: refresh what we show.
    onError: async (_error, id) => {
      await queryClient.invalidateQueries({ queryKey: vehicleKeys.detail(id) })
      await invalidateVehicleLists(queryClient)
    },
  })
}