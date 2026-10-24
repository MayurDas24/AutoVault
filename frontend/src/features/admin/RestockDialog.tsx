import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { TextField } from '../../components/ui/TextField'
import { getErrorMessage } from '../../lib/api/errors'
import type { Vehicle } from '../../lib/api/types'
import { formatUnits } from '../../lib/format'
import { useRestockVehicle } from './mutations'
import { validateRestock } from './validation'

export interface RestockDialogProps {
  vehicle: Vehicle
  onClose: () => void
  onRestocked: (message: string) => void
}

export function RestockDialog({ vehicle, onClose, onRestocked }: RestockDialogProps) {
  const restock = useRestockVehicle()
  const [quantity, setQuantity] = useState('')
  const [error, setError] = useState<string | undefined>()
  const inputRef = useRef<HTMLInputElement>(null)
  const name = `${vehicle.make} ${vehicle.model}`

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (restock.isPending) return

    const check = validateRestock(quantity)

    if (!check.ok) {
      setError(check.error)
      inputRef.current?.focus()
      return
    }

    setError(undefined)
    restock.mutate(
      { id: vehicle.id, quantity: check.quantity },
      {
        onSuccess: (result) =>
          onRestocked(
            `${result.vehicle.make} ${result.vehicle.model} restocked. ${formatUnits(result.vehicle.quantity)} now in stock.`,
          ),
      },
    )
  }

  return (
    <Dialog
      title={`Restock ${name}`}
      description={`Currently ${formatUnits(vehicle.quantity)} in stock.`}
      onClose={onClose}
      dismissible={!restock.isPending}
      initialFocusRef={inputRef}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {restock.isError ? <Alert variant="error">{getErrorMessage(restock.error)}</Alert> : null}

        <TextField
          ref={inputRef}
          label="Units to add"
          name="quantity"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          error={error}
          disabled={restock.isPending}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={restock.isPending}>
            Cancel
          </Button>
          <Button type="submit" isLoading={restock.isPending}>
            Add stock
          </Button>
        </div>
      </form>
    </Dialog>
  )
}