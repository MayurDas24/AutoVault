import { Car, LayoutDashboard, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NavSection = 'Workspace' | 'System'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  section: NavSection
  /** Match the route exactly (needed for the index route). */
  end?: boolean
  /** UI-only hint: hide this item from non-administrators. The API enforces real access. */
  adminOnly?: boolean
}

export const navSections: readonly NavSection[] = ['Workspace', 'System']

export const navItems: readonly NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, section: 'Workspace', end: true },
  { label: 'Inventory', to: '/inventory', icon: Car, section: 'Workspace' },
  {
    label: 'Administration',
    to: '/admin',
    icon: ShieldCheck,
    section: 'System',
    adminOnly: true,
  },
]

export interface RouteMeta {
  title: string
  /** Breadcrumb trail; the last entry is the current page. */
  trail: readonly string[]
}

export function getRouteMeta(pathname: string): RouteMeta {
  const normalized = pathname.replace(/\/+$/, '') || '/'
  const match = navItems.find((item) => item.to === normalized)

  if (match) {
    return { title: match.label, trail: [match.section, match.label] }
  }

  if (normalized.startsWith('/inventory/')) {
    return {
      title: 'Vehicle details',
      trail: ['Workspace', 'Inventory', 'Vehicle details'],
    }
  }

  return { title: 'Page not found', trail: ['Workspace', 'Not found'] }
}