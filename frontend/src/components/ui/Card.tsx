import type { ComponentPropsWithRef, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface CardProps extends ComponentPropsWithRef<'div'> {
  /** Adds a hover treatment for clickable or highlighted cards. */
  interactive?: boolean
}

export function Card({ interactive = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card',
        interactive &&
          'transition-[border-color,box-shadow] duration-150 hover:border-slate-300 hover:shadow-card-hover',
        className,
      )}
      {...props}
    />
  )
}

export interface CardHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  headingLevel?: 2 | 3
  className?: string
}

export function CardHeader({
  title,
  description,
  action,
  headingLevel = 2,
  className,
}: CardHeaderProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2'

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6',
        className,
      )}
    >
      <div className="min-w-0">
        <Heading className="text-base font-semibold tracking-tight text-slate-900">
          {title}
        </Heading>
        {description ? (
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function CardBody({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={cn('p-5 sm:p-6', className)} {...props} />
}