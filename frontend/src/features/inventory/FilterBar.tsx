import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { Search, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { toSearchParams, validateFilters } from './filters'
import type { FilterErrors, InventoryFilters } from './filters'

export interface FilterBarProps {
  /** Filters currently applied (from the URL). */
  applied: InventoryFilters
  categoryOptions: readonly string[]
  onApply: (filters: InventoryFilters) => void
  onClear: () => void
}

export function FilterBar({ applied, categoryOptions, onApply, onClear }: FilterBarProps) {
  const datalistId = useId()
  const appliedKey = toSearchParams(applied, 1).toString()

  const [values, setValues] = useState<InventoryFilters>(applied)
  const [errors, setErrors] = useState<FilterErrors>({})
  const [syncedKey, setSyncedKey] = useState(appliedKey)

  // When the URL changes (clear, back button), reset the form to match it.
  if (syncedKey !== appliedKey) {
    setSyncedKey(appliedKey)
    setValues(applied)
    setErrors({})
  }

  function update<K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validateFilters(values)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return
    onApply(values)
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-label="Inventory filters" className="p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <TextField
            label="Search vehicles"
            type="search"
            name="q"
            placeholder="Make, model or category"
            value={values.q}
            onChange={(event) => update('q', event.target.value)}
          />
        </div>
        <div className="lg:col-span-3">
          <TextField
            label="Category"
            name="category"
            list={datalistId}
            value={values.category}
            onChange={(event) => update('category', event.target.value)}
          />
          <datalist id={datalistId}>
            {categoryOptions.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
        </div>
        <div className="lg:col-span-2">
          <TextField
            label="Min price"
            type="number"
            name="minPrice"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={values.minPrice}
            onChange={(event) => update('minPrice', event.target.value)}
            error={errors.minPrice}
          />
        </div>
        <div className="lg:col-span-3">
          <TextField
            label="Max price"
            type="number"
            name="maxPrice"
            inputMode="decimal"
            min={0}
            step="0.01"
            value={values.maxPrice}
            onChange={(event) => update('maxPrice', event.target.value)}
            error={errors.maxPrice}
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={values.inStock}
            onChange={(event) => update('inStock', event.target.checked)}
            className="size-4 rounded border-slate-300 accent-brand-600"
          />
          In stock only
        </label>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            leftIcon={<X className="size-4" aria-hidden="true" />}
          >
            Clear filters
          </Button>
          <Button type="submit" leftIcon={<Search className="size-4" aria-hidden="true" />}>
            Apply filters
          </Button>
        </div>
      </div>
    </form>
  )
}