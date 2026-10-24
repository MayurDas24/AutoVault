import { Badge } from '../../components/ui/Badge'
import type { BadgeVariant } from '../../components/ui/Badge'
import { getStockStatus } from '../../lib/format'
import type { StockLevel } from '../../lib/format'

const variants: Record<StockLevel, BadgeVariant> = {
  in: 'success',
  low: 'warning',
  out: 'danger',
}

export function StockBadge({ quantity }: { quantity: number }) {
  const { level, label } = getStockStatus(quantity)

  return (
    <Badge variant={variants[level]} dot>
      {label}
    </Badge>
  )
}