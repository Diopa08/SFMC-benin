import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import RoleRoute from './components/RoleRoute'
import Layout from './components/Layout'
import ClientLayout from './components/ClientLayout'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import InventoryPage from './pages/InventoryPage'
import OrdersPage from './pages/OrdersPage'
import BillingPage from './pages/BillingPage'
import UsersPage from './pages/UsersPage'
import ProductionPage from './pages/ProductionPage'
import NotificationsPage from './pages/NotificationsPage'
import ShopPage from './pages/ShopPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Routes publiques ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ── Portail CLIENT (ROLE_USER) — top nav ── */}
        <Route element={
          <PrivateRoute>
            <RoleRoute roles={['ROLE_USER']}>
              <ClientLayout />
            </RoleRoute>
          </PrivateRoute>
        }>
          <Route path="/shop"    element={<ShopPage />} />
          <Route path="/orders"  element={<OrdersPage />} />
          <Route path="/billing" element={<BillingPage />} />
        </Route>

        {/* ── Back-office ADMIN / OPÉRATEUR — sidebar ── */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/products" element={
            <RoleRoute roles={['ROLE_ADMIN', 'ROLE_OPERATOR']}>
              <ProductsPage />
            </RoleRoute>
          } />
          <Route path="/inventory" element={
            <RoleRoute roles={['ROLE_ADMIN', 'ROLE_OPERATOR']}>
              <InventoryPage />
            </RoleRoute>
          } />
          <Route path="/orders-admin" element={<OrdersPage />} />
          <Route path="/billing-admin" element={
            <RoleRoute roles={['ROLE_ADMIN']}>
              <BillingPage />
            </RoleRoute>
          } />
          <Route path="/production" element={
            <RoleRoute roles={['ROLE_ADMIN', 'ROLE_OPERATOR']}>
              <ProductionPage />
            </RoleRoute>
          } />
          <Route path="/notifications" element={
            <RoleRoute roles={['ROLE_ADMIN', 'ROLE_OPERATOR']}>
              <NotificationsPage />
            </RoleRoute>
          } />
          <Route path="/users" element={
            <RoleRoute roles={['ROLE_ADMIN']}>
              <UsersPage />
            </RoleRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
