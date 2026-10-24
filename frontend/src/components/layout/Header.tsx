import type { RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { ChevronRight, LogOut, Menu, Search } from 'lucide-react'
import { useAuth } from '../../auth/useAuth'
import { getRouteMeta } from '../../lib/navigation'

export interface HeaderProps {
  onMenuClick: () => void
  menuButtonRef: RefObject<HTMLButtonElement | null>
  menuControlsId: string
  isMenuOpen: boolean
}

function getInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')

  return letters.join('') || '?'
}

export function Header({
  onMenuClick,
  menuButtonRef,
  menuControlsId,
  isMenuOpen,
}: HeaderProps) {
  const { pathname } = useLocation()
  const { title, trail } = getRouteMeta(pathname)
  const { user, isAdmin, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        aria-controls={menuControlsId}
        aria-expanded={isMenuOpen}
        className="-ml-1 inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden sm:block">
          <ol className="flex items-center gap-1 text-xs text-slate-500">
            {trail.map((crumb, index) => {
              const isLast = index === trail.length - 1
              return (
                <li key={crumb} className="flex items-center gap-1">
                  {index > 0 ? (
                    <ChevronRight className="size-3 text-slate-400" aria-hidden="true" />
                  ) : null}
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={isLast ? 'font-medium text-slate-700' : undefined}
                  >
                    {crumb}
                  </span>
                </li>
              )
            })}
          </ol>
        </nav>
        <p className="truncate text-sm font-semibold text-slate-900 sm:mt-0.5">{title}</p>
      </div>

      {/* Search affordance: visual only until inventory search is wired up */}
      <div className="relative hidden w-64 md:block lg:w-80">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          disabled
          aria-label="Search inventory"
          placeholder="Search make, model or category"
          title="Search will be available in an upcoming release"
          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed"
        />
      </div>
      <button
        type="button"
        disabled
        aria-label="Search inventory (coming soon)"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-500 disabled:cursor-not-allowed disabled:opacity-60 md:hidden"
      >
        <Search className="size-5" aria-hidden="true" />
      </button>

      <div
        role="group"
        aria-label="Account"
        className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1"
      >
        <div className="flex items-center gap-2.5 pl-0.5 pr-1">
          <span
            aria-hidden="true"
            className="inline-flex size-8 items-center justify-center rounded-md bg-brand-50 text-xs font-semibold text-brand-700"
          >
            {getInitials(user?.name ?? '')}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block max-w-36 truncate text-xs font-medium leading-tight text-slate-900">
              {user?.name ?? 'Account'}
            </span>
            <span className="block text-[11px] leading-tight text-slate-500">
              {isAdmin ? 'Administrator' : 'Customer'}
            </span>
          </span>
        </div>
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="inline-flex size-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
        >
          <LogOut className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  )
}