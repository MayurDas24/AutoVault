import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  CarFront,
  ChevronRight,
  PackageCheck,
  PackageSearch,
  PackageX,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Card, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHeader } from '../components/ui/PageHeader'
import { ResultsSkeleton } from '../features/inventory/ListParts'
import { VehicleTable } from '../features/inventory/VehicleTable'
import { useInventorySummary } from '../features/inventory/summary'
import { getErrorMessage } from '../lib/api/errors'
import { cn } from '../lib/cn'
import { LOW_STOCK_THRESHOLD, formatUnits } from '../lib/format'

type StatTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral'

const toneStyles: Record<StatTone, string> = {
  brand: 'bg-brand-50 text-brand-600',
  success: 'bg-emerald-50 text-emerald-600',
  warning: 'bg-amber-50 text-amber-600',
  danger: 'bg-red-50 text-red-600',
  neutral: 'bg-slate-100 text-slate-600',
}

interface StatCardProps {
  label: string
  /** `null` renders the placeholder (loading failed or not loaded yet). */
  value: string | null
  helper: string
  icon: LucideIcon
  tone?: StatTone
  isLoading?: boolean
}

function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'brand',
  isLoading = false,
}: StatCardProps) {
  return (
    <Card role="group" aria-label={label} className="p-5" aria-busy={isLoading || undefined}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span
          className={cn(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-lg',
            toneStyles[tone],
          )}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-4 flex min-h-9 items-center">
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded-md bg-slate-100">
            <span className="sr-only">Loading</span>
          </div>
        ) : value === null ? (
          <p className="text-3xl font-semibold tracking-tight text-slate-300">
            <span aria-hidden="true">—</span>
            <span className="sr-only">Unavailable</span>
          </p>
        ) : (
          <p className="text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </Card>
  )
}

interface QuickAction {
  label: string
  description: string
  icon: LucideIcon
  to: string
}

function QuickActionItem({ action }: { action: QuickAction }) {
  const { label, description, icon: Icon, to } = action

  return (
    <li>
      <Link
        to={to}
        className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
      >
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-slate-900">{label}</span>
          <span className="block truncate text-xs text-slate-500">{description}</span>
        </span>
        <ChevronRight
          className="size-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  )
}

export function DashboardPage() {
  const { isAdmin } = useAuth()
  const { data: summary, isPending, isError, error, refetch, isFetching } = useInventorySummary()

  const quickActions: QuickAction[] = [
    {
      label: 'Browse inventory',
      description: 'Explore every vehicle in the catalogue',
      icon: Boxes,
      to: '/inventory',
    },
    {
      label: 'Vehicles in stock',
      description: 'Only models with units available',
      icon: PackageCheck,
      to: '/inventory?inStock=true',
    },
    ...(isAdmin
      ? [
          {
            label: 'Manage inventory',
            description: 'Add, edit, restock or delete vehicles',
            icon: ShieldCheck,
            to: '/admin',
          },
        ]
      : []),
  ]

  function renderRecent() {
    if (isPending) return <ResultsSkeleton />

    if (isError) {
      return (
        <div role="alert">
          <EmptyState
            icon={TriangleAlert}
            title="We couldn't load the inventory summary"
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

    if (summary.totalModels === 0) {
      return (
        <EmptyState
          icon={PackageSearch}
          title="No vehicles in inventory yet"
          description={
            isAdmin
              ? 'Add your first vehicle from the Administration page.'
              : 'Vehicles added by an administrator will appear here.'
          }
          action={
            isAdmin ? (
              <Link to="/admin" className={buttonStyles({ variant: 'secondary' })}>
                Go to administration
              </Link>
            ) : undefined
          }
        />
      )
    }

    return <VehicleTable vehicles={summary.recent} />
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Dashboard"
        title="Inventory Overview"
        description="A snapshot of stock levels, availability and value across your dealership."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void refetch()}
              isLoading={isFetching}
              leftIcon={<RefreshCw className="size-4" aria-hidden="true" />}
            >
              Refresh
            </Button>
            <Link to="/inventory" className={buttonStyles()}>
              Browse inventory
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        }
      />

      {summary?.truncated ? (
        <Alert variant="info">
          Figures cover the first {summary.loadedCount.toLocaleString('en-US')} of{' '}
          {summary.totalModels.toLocaleString('en-US')} vehicles.
        </Alert>
      ) : null}

      <section aria-label="Inventory summary">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Vehicles"
            value={summary ? summary.totalModels.toLocaleString('en-US') : null}
            helper={
              summary ? `${formatUnits(summary.totalUnits)} in stock` : 'Models tracked in your catalogue'
            }
            icon={CarFront}
            tone="brand"
            isLoading={isPending}
          />
          <StatCard
            label="Inventory Value"
            value={summary ? summary.inventoryValue : null}
            helper="Combined value of units on hand"
            icon={Wallet}
            tone="neutral"
            isLoading={isPending}
          />
          <StatCard
            label="Low Stock"
            value={summary ? summary.lowStock.toLocaleString('en-US') : null}
            helper={`Vehicles with 1–${LOW_STOCK_THRESHOLD} units left`}
            icon={TriangleAlert}
            tone="warning"
            isLoading={isPending}
          />
          <StatCard
            label="Out of Stock"
            value={summary ? summary.outOfStock.toLocaleString('en-US') : null}
            helper="Vehicles with no units left"
            icon={PackageX}
            tone="danger"
            isLoading={isPending}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" aria-busy={isFetching}>
          <CardHeader
            title="Recent Inventory"
            description="The latest vehicles added to your catalogue"
            action={
              <Link to="/inventory" className={buttonStyles({ variant: 'ghost', size: 'sm' })}>
                View all
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            }
          />
          {renderRecent()}
        </Card>

        <Card>
          <CardHeader title="Quick Actions" description="Common dealership tasks" />
          <ul className="p-2">
            {quickActions.map((action) => (
              <QuickActionItem key={action.label} action={action} />
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}