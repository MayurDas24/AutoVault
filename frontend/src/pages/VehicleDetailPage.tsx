import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RefreshCw, SearchX, ShoppingCart, TriangleAlert } from 'lucide-react'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Card, CardBody, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { StockBadge } from '../features/inventory/StockBadge'
import { usePurchaseVehicle, useVehicle } from '../features/inventory/queries'
import { getErrorMessage, isApiError } from '../lib/api/errors'
import { formatDate, formatPrice, formatUnits } from '../lib/format'

function BackLink() {
  return (
    <Link to="/inventory" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
      <ArrowLeft className="size-4" aria-hidden="true" />
      Back to inventory
    </Link>
  )
}

function DetailSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading vehicle</span>
      <div aria-hidden="true" className="animate-pulse space-y-6">
        <div className="h-8 w-64 rounded bg-slate-200" />
        <div className="h-64 rounded-xl bg-slate-100" />
      </div>
    </div>
  )
}

export function VehicleDetailPage() {
  const { id = '' } = useParams()
  const { data: vehicle, isPending, isError, error, refetch } = useVehicle(id)
  const purchase = usePurchaseVehicle()

  if (isPending) return <DetailSkeleton />

  if (isError) {
    const notFound =
      isApiError(error) && (error.status === 404 || error.code === 'INVALID_VEHICLE_ID')

    return (
      <div className="space-y-6">
        <BackLink />
        <Card>
          <div role={notFound ? undefined : 'alert'}>
            {notFound ? (
              <EmptyState
                headingLevel={1}
                icon={SearchX}
                title="Vehicle not found"
                description="It may have been removed from the inventory."
              />
            ) : (
              <EmptyState
                headingLevel={1}
                icon={TriangleAlert}
                title="We couldn't load this vehicle"
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
            )}
          </div>
        </Card>
      </div>
    )
  }

  const soldOut = vehicle.quantity === 0
  const details: ReadonlyArray<readonly [string, string]> = [
    ['Make', vehicle.make],
    ['Model', vehicle.model],
    ['Price', formatPrice(vehicle.price)],
    ['Units in stock', formatUnits(vehicle.quantity)],
    ['Added', formatDate(vehicle.createdAt)],
    ['Last updated', formatDate(vehicle.updatedAt)],
  ]

  return (
    <div className="space-y-6">
      <BackLink />

      <PageHeader
        eyebrow={vehicle.category}
        title={`${vehicle.make} ${vehicle.model}`}
        actions={
          <>
            <Badge>{vehicle.category}</Badge>
            <StockBadge quantity={vehicle.quantity} />
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Vehicle details" />
          <dl className="grid gap-x-6 gap-y-5 p-5 sm:grid-cols-2 sm:p-6">
            {details.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {label}
                </dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card>
          <CardHeader title="Purchase" description="Records one sale and removes one unit from stock." />
          <CardBody className="space-y-4">
            {purchase.isSuccess ? (
              <Alert variant="success" title={purchase.data.message ?? 'Purchase complete'}>
                {formatUnits(purchase.data.vehicle.quantity)} remaining.
              </Alert>
            ) : null}
            {purchase.isError ? (
              <Alert variant="error">{getErrorMessage(purchase.error)}</Alert>
            ) : null}

            <Button
              fullWidth
              size="lg"
              isLoading={purchase.isPending}
              disabled={soldOut}
              onClick={() => purchase.mutate(vehicle.id)}
              leftIcon={<ShoppingCart className="size-4" aria-hidden="true" />}
            >
              Purchase vehicle
            </Button>

            {soldOut ? (
              <p className="text-sm text-slate-500">
                This vehicle is out of stock, so it can't be purchased right now.
              </p>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}