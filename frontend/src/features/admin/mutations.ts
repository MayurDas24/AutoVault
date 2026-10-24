import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createVehicle,
  deleteVehicle,
  restockVehicle,
  updateVehicle,
} from '../../lib/api/endpoints'
import type { CreateVehicleInput, UpdateVehicleInput } from '../../lib/api/types'
import { invalidateVehicleLists, vehicleKeys } from '../inventory/queries'

export function useCreateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateVehicleInput) => createVehicle(input),
    onSuccess: () => invalidateVehicleLists(queryClient),
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateVehicleInput }) =>
      updateVehicle(id, input),
    onSuccess: async (result) => {
      queryClient.setQueryData(vehicleKeys.detail(result.vehicle.id), result.vehicle)
      await invalidateVehicleLists(queryClient)
    },
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: async (_data, id) => {
      queryClient.removeQueries({ queryKey: vehicleKeys.detail(id) })
      await invalidateVehicleLists(queryClient)
    },
  })
}

export function useRestockVehicle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      restockVehicle(id, quantity),
    onSuccess: async (result) => {
      queryClient.setQueryData(vehicleKeys.detail(result.vehicle.id), result.vehicle)
      await invalidateVehicleLists(queryClient)
    },
  })
}