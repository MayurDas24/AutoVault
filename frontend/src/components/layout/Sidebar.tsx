import { useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CarFront, X } from 'lucide-react'
import { navItems, navSections } from '../../lib/navigation'
import { cn } from '../../lib/cn'

export interface SidebarProps {
  id: string
  /** Only affects the mobile drawer; the sidebar is always visible on lg+. */
  isOpen: boolean
  onClose: () => void
  /**
   * UI-only: whether to list admin-only destinations. Defaults to true until
   * authentication exists (Milestone 3). The backend remains the real gatekeeper.
   */
  showAdminItems?: boolean
}

export function Sidebar({ id, isOpen, onClose, showAdminItems = true }: SidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
    }
  }, [isOpen])

  const visibleItems = navItems.filter((item) => !item.adminOnly || showAdminItems)
  const visibleSections = navSections.filter((section) =>
    visibleItems.some((item) => item.section === section),
  )

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-30 bg-midnight-950/60 transition-opacity duration-200 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      <aside
        id={id}
        aria-label="Sidebar"
        data-surface="dark"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-midnight-900 text-slate-300 transition-[transform,visibility] duration-200 ease-out lg:w-64 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full max-lg:invisible',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-white/5 px-5">
          <Link
            to="/"
            onClick={onClose}
            className="flex min-w-0 items-center gap-3 rounded-lg"
          >
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white shadow-card">
              <CarFront className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] font-semibold leading-tight tracking-tight text-white">
                AutoVault
              </span>
              <span className="block text-[11px] leading-snug text-slate-400">
                Dealership Inventory Management
              </span>
            </span>
          </Link>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {visibleSections.map((section) => (
            <div key={section}>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                {section}
              </p>
              <ul className="mt-2 space-y-1">
                {visibleItems
                  .filter((item) => item.section === section)
                  .map(({ label, to, icon: Icon, end }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={end}
                        onClick={onClose}
                        className={({ isActive }) =>
                          cn(
                            'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                            isActive
                              ? 'bg-white/10 text-white'
                              : 'text-slate-400 hover:bg-white/5 hover:text-white',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              aria-hidden="true"
                              className={cn(
                                'absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-400 transition-opacity duration-150',
                                isActive ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            <Icon
                              className={cn(
                                'size-[18px] shrink-0',
                                isActive ? 'text-brand-300' : 'text-slate-500',
                              )}
                              aria-hidden="true"
                            />
                            {label}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* <div className="shrink-0 border-t border-white/5 p-4">
          <div className="rounded-lg bg-midnight-800 px-3.5 py-3">
            <p className="flex items-center gap-2 text-xs font-medium text-slate-200">
              <span className="size-1.5 rounded-full bg-slate-500" aria-hidden="true" />
              Data connection
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Not connected yet. Live inventory will appear here.
            </p>
          </div>
        </div> */}
      </aside>
    </>
  )
}