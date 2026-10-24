import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackageSearch, RefreshCw, TriangleAlert } from 'lucide-react'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { FilterBar } from '../features/inventory/FilterBar'
import { PaginationBar, ResultsSkeleton } from '../features/inventory/ListParts'
import { VehicleTable } from '../features/inventory/VehicleTable'
import {
  emptyFilters,
  hasActiveFilters,
  readFilters,
  readPage,
  toSearchParams,
  toVehicleQuery,
} from '../features/inventory/filters'
import type { InventoryFilters } from '../features/inventory/filters'
import { usePurchaseVehicle, useVehicles } from '../features/inventory/queries'
import { getErrorMessage } from '../lib/api/errors'
import type { Vehicle } from '../lib/api/types'
import { formatUnits } from '../lib/format'

interface PurchaseNotice {
  kind: 'success' | 'error'
  text: string
}

export function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = readFilters(searchParams)
  const page = readPage(searchParams)

  const { data, isPending, isError, error, refetch, isFetching, isPlaceholderData } =
    useVehicles(toVehicleQuery(filters, page))

  const purchase = usePurchaseVehicle()
  const [notice, setNotice] = useState<PurchaseNotice | null>(null)
  const purchasingId = purchase.isPending ? (purchase.variables ?? null) : null

  const filtersActive = hasActiveFilters(filters)
  const categoryOptions = [...new Set(data?.vehicles.map((vehicle) => vehicle.category) ?? [])].sort()

  function applyFilters(next: InventoryFilters) {
    setSearchParams(toSearchParams(next, 1))
  }

  function clearFilters() {
    setSearchParams(toSearchParams(emptyFilters, 1))
  }

  function goToPage(nextPage: number) {
    setSearchParams(toSearchParams(filters, nextPage))
  }

  function handlePurchase(vehicle: Vehicle) {
    setNotice(null)

    purchase.mutate(vehicle.id, {
      onSuccess: (result) =>
        setNotice({
          kind: 'success',
          text: `Purchased ${result.vehicle.make} ${result.vehicle.model}. ${formatUnits(result.vehicle.quantity)} remaining.`,
        }),
      onError: (purchaseError) =>
        setNotice({ kind: 'error', text: getErrorMessage(purchaseError) }),
    })
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
            action={<Button onClick={() => goToPage(1)}>Go to first page</Button>}
          />
        )
      }

      return filtersActive ? (
        <EmptyState
          icon={PackageSearch}
          title="No vehicles match your filters"
          description="Try a different search term or widen the price range."
          action={
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={PackageSearch}
          title="No vehicles in inventory yet"
          description="Vehicles added by an administrator will appear here."
        />
      )
    }

    return (
      <>
        <VehicleTable
          vehicles={data.vehicles}
          isStale={isPlaceholderData}
          onPurchase={handlePurchase}
          purchasingId={purchasingId}
        />
        <PaginationBar
          pagination={data.pagination}
          shown={data.vehicles.length}
          onPageChange={goToPage}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Inventory"
        description="Browse, search and manage every vehicle in your dealership catalogue."
      />

      {notice ? <Alert variant={notice.kind}>{notice.text}</Alert> : null}

      <Card>
        <FilterBar
          applied={filters}
          categoryOptions={categoryOptions}
          onApply={applyFilters}
          onClear={clearFilters}
        />
      </Card>

      <Card aria-busy={isFetching}>{renderResults()}</Card>
    </div>
  )
}