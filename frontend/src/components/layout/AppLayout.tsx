import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const SIDEBAR_ID = 'app-sidebar'
const DESKTOP_QUERY = '(min-width: 1024px)'

export function AppLayout() {
  const { pathname } = useLocation()
  const { isAdmin } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)

  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const openSidebar = useCallback(() => setIsSidebarOpen(true), [])

  // While the mobile drawer is open: close on Escape and lock page scroll.
  useEffect(() => {
    if (!isSidebarOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSidebarOpen])

  // Reset the drawer if the viewport grows to desktop width.
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return

    const mediaQuery = window.matchMedia(DESKTOP_QUERY)
    const handleChange = (event: MediaQueryListEvent) => {
      if (event.matches) setIsSidebarOpen(false)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-card-hover"
      >
        Skip to main content
      </a>

      <Sidebar
        id={SIDEBAR_ID}
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        showAdminItems={isAdmin}
      />

      <div className="flex min-h-dvh flex-col lg:pl-64">
        <Header
          onMenuClick={openSidebar}
          menuButtonRef={menuButtonRef}
          menuControlsId={SIDEBAR_ID}
          isMenuOpen={isSidebarOpen}
        />

        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <div
            key={pathname}
            className="page-enter mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}