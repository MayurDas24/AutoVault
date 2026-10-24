import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { TextField } from '../../components/ui/TextField'
import { getErrorMessage } from '../../lib/api/errors'
import type { Vehicle } from '../../lib/api/types'
import { CURRENCY } from '../../lib/format'
import { useCreateVehicle, useUpdateVehicle } from './mutations'
import {
  emptyVehicleForm,
  getVehicleChanges,
  toCreateInput,
  validateVehicleForm,
  vehicleFieldOrder,
} from './validation'
import type { VehicleFormErrors, VehicleFormValues } from './validation'

export interface VehicleFormDialogProps {
  /** Present when editing; absent when adding a new vehicle. */
  vehicle?: Vehicle
  onClose: () => void
  onSaved: (message: string) => void
}

export function VehicleFormDialog({ vehicle, onClose, onSaved }: VehicleFormDialogProps) {
  const create = useCreateVehicle()
  const update = useUpdateVehicle()
  const isSaving = create.isPending || update.isPending

  const [values, setValues] = useState<VehicleFormValues>(() =>
    vehicle
      ? {
          make: vehicle.make,
          model: vehicle.model,
          category: vehicle.category,
          price: Number(vehicle.price).toFixed(2),
          quantity: '',
        }
      : emptyVehicleForm,
  )
  const [errors, setErrors] = useState<VehicleFormErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const makeRef = useRef<HTMLInputElement>(null)
  const modelRef = useRef<HTMLInputElement>(null)
  const categoryRef = useRef<HTMLInputElement>(null)
  const priceRef = useRef<HTMLInputElement>(null)
  const quantityRef = useRef<HTMLInputElement>(null)
  const fieldRefs = {
    make: makeRef,
    model: modelRef,
    category: categoryRef,
    price: priceRef,
    quantity: quantityRef,
  }

  function setValue(key: keyof VehicleFormValues, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    setFormError(null)

    const nextErrors = validateVehicleForm(values, vehicle ? 'edit' : 'create')
    setErrors(nextErrors)

    const firstInvalid = vehicleFieldOrder.find((field) => nextErrors[field])
    if (firstInvalid) {
      fieldRefs[firstInvalid].current?.focus()
      return
    }

    try {
      if (vehicle) {
        const changes = getVehicleChanges(vehicle, values)

        if (Object.keys(changes).length === 0) {
          setFormError('Change at least one detail before saving.')
          return
        }

        const result = await update.mutateAsync({ id: vehicle.id, input: changes })
        onSaved(`Updated ${result.vehicle.make} ${result.vehicle.model}.`)
      } else {
        const result = await create.mutateAsync(toCreateInput(values))
        onSaved(`Added ${result.vehicle.make} ${result.vehicle.model} to the inventory.`)
      }
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <Dialog
      title={vehicle ? `Edit ${vehicle.make} ${vehicle.model}` : 'Add a vehicle'}
      description={
        vehicle
          ? 'Stock changes only through purchases and restocking.'
          : 'Add a new make and model to the inventory.'
      }
      onClose={onClose}
      dismissible={!isSaving}
      initialFocusRef={makeRef}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <Alert variant="error">{formError}</Alert> : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            ref={makeRef}
            label="Make"
            name="make"
            value={values.make}
            onChange={(event) => setValue('make', event.target.value)}
            error={errors.make}
            disabled={isSaving}
          />
          <TextField
            ref={modelRef}
            label="Model"
            name="model"
            value={values.model}
            onChange={(event) => setValue('model', event.target.value)}
            error={errors.model}
            disabled={isSaving}
          />
        </div>

        <TextField
          ref={categoryRef}
          label="Category"
          name="category"
          placeholder="e.g. SUV, Sedan, Hatchback"
          value={values.category}
          onChange={(event) => setValue('category', event.target.value)}
          error={errors.category}
          disabled={isSaving}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            ref={priceRef}
            label="Price"
            name="price"
            inputMode="decimal"
            hint={`Amount in ${CURRENCY}, up to two decimals.`}
            value={values.price}
            onChange={(event) => setValue('price', event.target.value)}
            error={errors.price}
            disabled={isSaving}
          />
          {vehicle ? null : (
            <TextField
              ref={quantityRef}
              label="Starting stock"
              name="quantity"
              inputMode="numeric"
              hint="Units available now."
              value={values.quantity}
              onChange={(event) => setValue('quantity', event.target.value)}
              error={errors.quantity}
              disabled={isSaving}
            />
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            {vehicle ? 'Save changes' : 'Create vehicle'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}