import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireAdmin, RequireAuth } from './auth/RouteGuards'
import { AppLayout } from './components/layout/AppLayout'
import { AuthLayout } from './components/layout/AuthLayout'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { InventoryPage } from './pages/InventoryPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { RegisterPage } from './pages/RegisterPage'
import { VehicleDetailPage } from './pages/VehicleDetailPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<GuestOnly />}>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/:id" element={<VehicleDetailPage />} />
          <Route element={<RequireAdmin />}>
            <Route path="admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}