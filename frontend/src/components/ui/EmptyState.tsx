import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

export interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
  headingLevel?: 1 | 2 | 3
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  headingLevel = 2,
  className,
}: EmptyStateProps) {
  const Heading = `h${headingLevel}` as const

  return (
    <div
      className={cn(
        'flex flex-col items-center px-6 py-14 text-center sm:py-16',
        className,
      )}
    >
      <span className="inline-flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <Heading className="mt-5 text-base font-semibold tracking-tight text-slate-900">
        {title}
      </Heading>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}