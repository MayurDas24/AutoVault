import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import type { Pagination } from '../../lib/api/types'

export function ResultsSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading inventory</span>
      <div aria-hidden="true" className="divide-y divide-slate-100">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-6 px-6 py-4">
            <div className="h-4 w-1/4 rounded bg-slate-100" />
            <div className="h-4 w-1/6 rounded bg-slate-100" />
            <div className="ml-auto h-4 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

export interface PaginationBarProps {
  pagination: Pagination
  shown: number
  onPageChange: (page: number) => void
}

export function PaginationBar({ pagination, shown, onPageChange }: PaginationBarProps) {
  const { page, limit, total, totalPages } = pagination
  const start = (page - 1) * limit + 1
  const end = start + shown - 1

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 sm:px-6">
      <p aria-live="polite" className="text-sm text-slate-500">
        Showing {start}–{end} of {total.toLocaleString('en-US')} vehicles
      </p>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">
          Page {page} of {Math.max(totalPages, 1)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}