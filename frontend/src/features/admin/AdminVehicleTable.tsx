import { Link } from 'react-router-dom'
import { PackagePlus, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { cn } from '../../lib/cn'
import { formatPrice } from '../../lib/format'
import type { Vehicle } from '../../lib/api/types'
import { StockBadge } from '../inventory/StockBadge'

export interface AdminVehicleTableProps {
  vehicles: readonly Vehicle[]
  isStale?: boolean
  onEdit: (vehicle: Vehicle) => void
  onRestock: (vehicle: Vehicle) => void
  onDelete: (vehicle: Vehicle) => void
}

export function AdminVehicleTable({
  vehicles,
  isStale = false,
  onEdit,
  onRestock,
  onDelete,
}: AdminVehicleTableProps) {
  return (
    <div className={cn('overflow-x-auto transition-opacity', isStale && 'opacity-60')}>
      <table className="w-full min-w-[52rem] text-left text-sm">
        <caption className="sr-only">Vehicle management</caption>
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
            <th scope="col" className="px-6 py-3 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => {
            const name = `${vehicle.make} ${vehicle.model}`

            return (
              <tr
                key={vehicle.id}
                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60"
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
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(vehicle)}
                      aria-label={`Edit ${name}`}
                      leftIcon={<Pencil className="size-3.5" aria-hidden="true" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRestock(vehicle)}
                      aria-label={`Restock ${name}`}
                      leftIcon={<PackagePlus className="size-3.5" aria-hidden="true" />}
                    >
                      Restock
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(vehicle)}
                      aria-label={`Delete ${name}`}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
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