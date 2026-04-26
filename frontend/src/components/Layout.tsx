import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Package, ShoppingCart,
  Warehouse, FileText, LogOut, Menu, X, Factory, Users, Bell, Store
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getUnreadCount } from '../api/notifications'

const allNav = [
  { to: '/dashboard',      label: 'Tableau de bord', icon: LayoutDashboard, roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/products',       label: 'Produits',         icon: Package,         roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/inventory',      label: 'Inventaire',       icon: Warehouse,       roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/orders-admin',   label: 'Commandes',        icon: ShoppingCart,    roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/production',     label: 'Production',       icon: Factory,         roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/billing-admin',  label: 'Facturation',      icon: FileText,        roles: ['ROLE_ADMIN'] },
  { to: '/notifications',  label: 'Notifications',    icon: Bell,            roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/users',          label: 'Utilisateurs',     icon: Users,           roles: ['ROLE_ADMIN'] },
]

const roleBadge: Record<string, { label: string; color: string }> = {
  ROLE_ADMIN:    { label: 'Administrateur', color: 'bg-red-500' },
  ROLE_OPERATOR: { label: 'Opérateur',      color: 'bg-yellow-500' },
  ROLE_USER:     { label: 'Utilisateur',    color: 'bg-blue-500' },
}

export default function Layout() {
  const { user, signOut, hasRole } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try { setUnreadCount(await getUnreadCount()) } catch { /* ignore */ }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => { signOut(); navigate('/login') }

  const nav = allNav.filter(item => item.roles.some(r => hasRole(r)))

  const primaryRole = ['ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_USER'].find(r => hasRole(r))
  const badge = primaryRole ? roleBadge[primaryRole] : null

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${open ? 'w-64' : 'w-16'} transition-all duration-300 bg-gray-900 text-white flex flex-col`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-700">
          <Factory size={28} className="text-blue-400 shrink-0" />
          {open && <span className="font-bold text-lg tracking-wide">SFMC Bénin</span>}
        </div>

        {/* Toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="mx-auto mt-3 p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>

        {/* Nav links */}
        <nav className="flex-1 mt-4 px-2 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm
                ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`
              }
            >
              <div className="relative shrink-0">
                <Icon size={20} />
                {to === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {open && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="border-t border-gray-700 p-4 space-y-2">
          {open && (
            <div>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              {badge && (
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white ${badge.color}`}>
                  {badge.label}
                </span>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-300 hover:text-red-400 transition-colors text-sm w-full"
          >
            <LogOut size={18} className="shrink-0" />
            {open && 'Se déconnecter'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
