import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoaderCircle, Lock } from 'lucide-react'
import { buttonStyles } from '../components/ui/buttonStyles'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { getSafeRedirectPath } from './auth-context'
import { useAuth } from './useAuth'

function FullPageSpinner() {
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-canvas">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <LoaderCircle className="size-5 animate-spin text-brand-600" aria-hidden="true" />
        Checking your session…
      </div>
    </div>
  )
}

/** Protects routes that need a signed-in user. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />

  if (status === 'unauthenticated') {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}

/**
 * UI-level role gate for administrator pages. The API enforces authorization
 * on every request regardless of what this component renders.
 */
export function RequireAdmin() {
  const { isAdmin } = useAuth()

  if (!isAdmin) {
    return (
      <Card>
        <EmptyState
          headingLevel={1}
          icon={Lock}
          title="Administrator access required"
          description="Your account doesn't have permission to view this page."
          action={
            <Link to="/" className={buttonStyles()}>
              Back to dashboard
            </Link>
          }
        />
      </Card>
    )
  }

  return <Outlet />
}

/** Keeps signed-in users away from the login and register pages. */
export function GuestOnly() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <FullPageSpinner />

  if (status === 'authenticated') {
    const state = location.state as { from?: unknown } | null
    return <Navigate to={getSafeRedirectPath(state?.from)} replace />
  }

  return <Outlet />
}