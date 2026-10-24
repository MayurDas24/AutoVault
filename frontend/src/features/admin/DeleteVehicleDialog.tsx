import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { getErrorMessage } from '../../lib/api/errors'
import type { Vehicle } from '../../lib/api/types'
import { useDeleteVehicle } from './mutations'

export interface DeleteVehicleDialogProps {
  vehicle: Vehicle
  onClose: () => void
  onDeleted: (message: string) => void
}

export function DeleteVehicleDialog({ vehicle, onClose, onDeleted }: DeleteVehicleDialogProps) {
  const remove = useDeleteVehicle()
  const name = `${vehicle.make} ${vehicle.model}`

  return (
    <ConfirmDialog
      title={`Delete ${name}?`}
      description="This permanently removes the vehicle and its stock from the inventory. This can't be undone."
      confirmLabel="Delete vehicle"
      isLoading={remove.isPending}
      error={remove.isError ? getErrorMessage(remove.error) : null}
      onCancel={onClose}
      onConfirm={() =>
        remove.mutate(vehicle.id, { onSuccess: () => onDeleted(`Deleted ${name}.`) })
      }
    />
  )
}