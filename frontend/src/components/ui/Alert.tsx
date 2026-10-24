import type { ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export type AlertVariant = 'error' | 'success' | 'info' | 'warning'

const variants: Record<AlertVariant, { box: string; icon: LucideIcon; iconColor: string }> = {
  error: { box: 'border-red-200 bg-red-50 text-red-800', icon: CircleAlert, iconColor: 'text-red-600' },
  success: { box: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CircleCheck, iconColor: 'text-emerald-600' },
  info: { box: 'border-brand-200 bg-brand-50 text-brand-800', icon: Info, iconColor: 'text-brand-600' },
  warning: { box: 'border-amber-200 bg-amber-50 text-amber-900', icon: TriangleAlert, iconColor: 'text-amber-600' },
}

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  children?: ReactNode
  className?: string
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  const { box, icon: Icon, iconColor } = variants[variant]

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-lg border px-4 py-3 text-sm', box, className)}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', iconColor)} aria-hidden="true" />
      <div className="min-w-0">
        {title ? <p className="font-medium">{title}</p> : null}
        {children ? <div className={title ? 'mt-0.5' : undefined}>{children}</div> : null}
      </div>
    </div>
  )
}