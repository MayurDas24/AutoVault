import { useState } from 'react'
import type { FormEvent } from 'react'
import { PackageSearch, Plus, RefreshCw, Search, TriangleAlert } from 'lucide-react'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { TextField } from '../components/ui/TextField'
import { AdminVehicleTable } from '../features/admin/AdminVehicleTable'
import { DeleteVehicleDialog } from '../features/admin/DeleteVehicleDialog'
import { RestockDialog } from '../features/admin/RestockDialog'
import { VehicleFormDialog } from '../features/admin/VehicleFormDialog'
import { PAGE_SIZE } from '../features/inventory/filters'
import { PaginationBar, ResultsSkeleton } from '../features/inventory/ListParts'
import { useVehicles } from '../features/inventory/queries'
import { getErrorMessage } from '../lib/api/errors'
import type { Vehicle } from '../lib/api/types'

type DialogState =
  | { kind: 'none' }
  | { kind: 'create' }
  | { kind: 'edit'; vehicle: Vehicle }
  | { kind: 'restock'; vehicle: Vehicle }
  | { kind: 'delete'; vehicle: Vehicle }

/**
 * Administrator console. Access is gated by the route guard for the UI;
 * the API enforces authorization on every request regardless.
 */
export function AdminPage() {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState<DialogState>({ kind: 'none' })
  const [notice, setNotice] = useState<string | null>(null)

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } = useVehicles({
    q: query || undefined,
    page,
    limit: PAGE_SIZE,
  })

  function openDialog(next: DialogState) {
    setNotice(null)
    setDialog(next)
  }

  function closeDialog() {
    setDialog({ kind: 'none' })
  }

  function handleDone(message: string) {
    setNotice(message)
    setDialog({ kind: 'none' })
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setQuery(searchInput.trim())
    setPage(1)
  }

  function clearSearch() {
    setSearchInput('')
    setQuery('')
    setPage(1)
  }

  function renderResults() {
    if (isPending) return <ResultsSkeleton />

    if (isError) {
      return (
        <div role="alert">
          <EmptyState
            icon={TriangleAlert}
            title="We couldn't load the inventory"
            description={getErrorMessage(error)}
            action={
              <Button
                variant="secondary"
                onClick={() => void refetch()}
                leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
              >
                Try again
              </Button>
            }
          />
        </div>
      )
    }

    if (data.vehicles.length === 0) {
      if (data.pagination.total > 0) {
        return (
          <EmptyState
            icon={PackageSearch}
            title="This page is empty"
            description="The inventory changed since you opened this page."
            action={<Button onClick={() => setPage(1)}>Go to first page</Button>}
          />
        )
      }

      return query ? (
        <EmptyState
          icon={PackageSearch}
          title="No vehicles match your search"
          description="Try a different make, model or category."
          action={
            <Button variant="secondary" onClick={clearSearch}>
              Clear search
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="No vehicles in inventory yet"
          description="Add the first vehicle to start tracking stock."
          action={
            <Button
              onClick={() => openDialog({ kind: 'create' })}
              leftIcon={<Plus className="size-4" aria-hidden="true" />}
            >
              Add your first vehicle
            </Button>
          }
        />
      )
    }

    return (
      <>
        <AdminVehicleTable
          vehicles={data.vehicles}
          isStale={isPlaceholderData}
          onEdit={(vehicle) => openDialog({ kind: 'edit', vehicle })}
          onRestock={(vehicle) => openDialog({ kind: 'restock', vehicle })}
          onDelete={(vehicle) => openDialog({ kind: 'delete', vehicle })}
        />
        <PaginationBar
          pagination={data.pagination}
          shown={data.vehicles.length}
          onPageChange={setPage}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="System"
        title="Administration"
        description="Add, edit, restock and remove vehicles in your dealership catalogue."
        actions={
          <Button
            onClick={() => openDialog({ kind: 'create' })}
            leftIcon={<Plus className="size-4" aria-hidden="true" />}
          >
            Add vehicle
          </Button>
        }
      />

      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <Card>
        <form
          onSubmit={handleSearch}
          noValidate
          aria-label="Search vehicles"
          className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end sm:p-6"
        >
          <div className="flex-1">
            <TextField
              label="Search vehicles"
              type="search"
              name="q"
              placeholder="Make, model or category"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              variant="secondary"
              leftIcon={<Search className="size-4" aria-hidden="true" />}
            >
              Search
            </Button>
            {query ? (
              <Button variant="ghost" onClick={clearSearch}>
                Clear
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card aria-busy={isFetching}>{renderResults()}</Card>

      {dialog.kind === 'create' ? (
        <VehicleFormDialog onClose={closeDialog} onSaved={handleDone} />
      ) : null}
      {dialog.kind === 'edit' ? (
        <VehicleFormDialog vehicle={dialog.vehicle} onClose={closeDialog} onSaved={handleDone} />
      ) : null}
      {dialog.kind === 'restock' ? (
        <RestockDialog vehicle={dialog.vehicle} onClose={closeDialog} onRestocked={handleDone} />
      ) : null}
      {dialog.kind === 'delete' ? (
        <DeleteVehicleDialog vehicle={dialog.vehicle} onClose={closeDialog} onDeleted={handleDone} />
      ) : null}
    </div>
  )
}