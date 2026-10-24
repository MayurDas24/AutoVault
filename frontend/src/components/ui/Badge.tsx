import type { ComponentPropsWithRef } from 'react'
import { cn } from '../../lib/cn'

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'

const variantStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-red-200',
}

const dotStyles: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

export interface BadgeProps extends ComponentPropsWithRef<'span'> {
  variant?: BadgeVariant
  /** Shows a small status dot before the label. */
  dot?: boolean
}

export function Badge({
  variant = 'neutral',
  dot = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          className={cn('size-1.5 rounded-full', dotStyles[variant])}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  )
}