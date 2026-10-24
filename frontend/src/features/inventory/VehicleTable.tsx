import { Link } from 'react-router-dom'
import { ChevronRight, ShoppingCart } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { buttonStyles } from '../../components/ui/buttonStyles'
import { cn } from '../../lib/cn'
import { formatPrice } from '../../lib/format'
import type { Vehicle } from '../../lib/api/types'
import { StockBadge } from './StockBadge'

export interface VehicleTableProps {
  vehicles: readonly Vehicle[]
  /** Dims the table while a new page or filter set is loading. */
  isStale?: boolean
  /** When provided, every row gets a Purchase button (disabled when sold out). */
  onPurchase?: (vehicle: Vehicle) => void
  /** Id of the vehicle whose purchase is in flight, if any. */
  purchasingId?: string | null
}

export function VehicleTable({
  vehicles,
  isStale = false,
  onPurchase,
  purchasingId = null,
}: VehicleTableProps) {
  const busy = purchasingId !== null

  return (
    <div className={cn('overflow-x-auto transition-opacity', isStale && 'opacity-60')}>
      <table className="w-full min-w-[56rem] text-left text-sm">
        <caption className="sr-only">Vehicle inventory</caption>
        <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-6 py-3">
              Vehicle
            </th>
            <th scope="col" className="px-4 py-3">
              Category
            </th>
            <th scope="col" className="px-4 py-3 text-right">
              Price
            </th>
            <th scope="col" className="px-4 py-3">
              Stock
            </th>
            <th scope="col" className="px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const name = `${vehicle.make} ${vehicle.model}`
            const soldOut = vehicle.quantity <= 0
            const isBuying = purchasingId === vehicle.id

            return (
              <tr
                key={vehicle.id}
                className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60"
              >
                <td className="px-6 py-4">
                  <Link
                    to={`/inventory/${encodeURIComponent(vehicle.id)}`}
                    className="font-medium text-slate-900 hover:text-brand-700"
                  >
                    {name}
                  </Link>
                </td>
                <td className="px-4 py-4">
                  <Badge>{vehicle.category}</Badge>
                </td>
                <td className="px-4 py-4 text-right tabular-nums text-slate-900">
                  {formatPrice(vehicle.price)}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 tabular-nums text-slate-700">{vehicle.quantity}</span>
                    <StockBadge quantity={vehicle.quantity} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {onPurchase ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onPurchase(vehicle)}
                        disabled={soldOut || (busy && !isBuying)}
                        isLoading={isBuying}
                        title={soldOut ? 'Out of stock' : undefined}
                        aria-label={`Purchase ${name}`}
                        leftIcon={<ShoppingCart className="size-3.5" aria-hidden="true" />}
                      >
                        Purchase
                      </Button>
                    ) : null}
                    <Link
                      to={`/inventory/${encodeURIComponent(vehicle.id)}`}
                      aria-label={`View ${name}`}
                      className={buttonStyles({ variant: 'ghost', size: 'sm' })}
                    >
                      View
                      <ChevronRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}