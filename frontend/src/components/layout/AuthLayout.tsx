import { Outlet } from 'react-router-dom'
import { Boxes, CarFront, PackageCheck, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Highlight {
  icon: LucideIcon
  title: string
  description: string
}

const highlights: readonly Highlight[] = [
  {
    icon: Boxes,
    title: 'One view of your stock',
    description: 'Search the catalogue by make, model, category and price.',
  },
  {
    icon: PackageCheck,
    title: 'Purchases that stay accurate',
    description: 'Every sale updates quantities on the server.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Administrators manage the catalogue; everyone else browses and buys.',
  },
]

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-card">
        <CarFront className="size-5" aria-hidden="true" />
      </span>
      <span>
        <span
          className={`block text-[15px] font-semibold leading-tight tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}
        >
          AutoVault
        </span>
        <span className={`block text-[11px] leading-snug ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Dealership Inventory Management
        </span>
      </span>
    </div>
  )
}

export function AuthLayout() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside
        data-surface="dark"
        className="hidden flex-col justify-between bg-midnight-900 p-10 text-slate-300 lg:flex"
      >
        <Brand dark />

        <div>
          <p className="max-w-sm text-2xl font-semibold leading-snug tracking-tight text-white">
            Run your dealership inventory with confidence.
          </p>
          <ul className="mt-8 space-y-6">
            {highlights.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-300">
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{title}</span>
                  <span className="mt-0.5 block text-sm text-slate-400">{description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-500">AutoVault</p>
      </aside>

      <main className="flex items-center justify-center bg-canvas px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}