import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard, Package, ShoppingCart,
  Warehouse, FileText, LogOut, Factory,
  Users, Bell, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUnreadCount } from '../api/notifications'

const allNav = [
  { to: '/dashboard',     label: 'Tableau de bord', icon: LayoutDashboard, roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/products',      label: 'Produits',         icon: Package,         roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/inventory',     label: 'Inventaire',       icon: Warehouse,       roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/orders-admin',  label: 'Commandes',        icon: ShoppingCart,    roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/production',    label: 'Production',       icon: Factory,         roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/billing-admin', label: 'Facturation',      icon: FileText,        roles: ['ROLE_ADMIN'] },
  { to: '/notifications', label: 'Notifications',    icon: Bell,            roles: ['ROLE_ADMIN', 'ROLE_OPERATOR'] },
  { to: '/users',         label: 'Utilisateurs',     icon: Users,           roles: ['ROLE_ADMIN'] },
]

const roleConfig: Record<string, { label: string; color: string; dot: string }> = {
  ROLE_ADMIN:    { label: 'Administrateur', color: 'text-violet-400',  dot: 'bg-violet-400' },
  ROLE_OPERATOR: { label: 'Opérateur',      color: 'text-amber-400',   dot: 'bg-amber-400'  },
  ROLE_USER:     { label: 'Utilisateur',    color: 'text-sky-400',     dot: 'bg-sky-400'    },
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name
    .split(/[@.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase())
    .join('')
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-black text-white shrink-0 shadow-lg shadow-indigo-500/20`}>
      {initials || '?'}
    </div>
  )
}

export default function Layout() {
  const { user, signOut, hasRole } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      try { setUnreadCount(await getUnreadCount()) } catch { /* ignore */ }
    }
    fetch()
    const t = setInterval(fetch, 30000)
    return () => clearInterval(t)
  }, [])

  const handleLogout = () => { signOut(); navigate('/login') }
  const nav = allNav.filter(item => item.roles.some(r => hasRole(r)))
  const primaryRole = ['ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_USER'].find(r => hasRole(r))
  const role = primaryRole ? roleConfig[primaryRole] : null
  const username = user?.email?.split('@')[0] ?? 'Utilisateur'

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="relative flex flex-col bg-zinc-950 border-r border-white/[0.06] overflow-hidden shrink-0 z-20"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06] shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
            <Factory size={16} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <p className="font-black text-white text-sm leading-tight tracking-tight">SFMC</p>
                <p className="text-zinc-500 text-[10px] font-semibold tracking-widest uppercase leading-tight">Bénin</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto scrollbar-none">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium
                ${isActive
                  ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] border border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active glow */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-full" />
                  )}

                  <div className="relative shrink-0">
                    <Icon size={17} className={isActive ? 'text-indigo-400' : ''} />
                    {to === '/notifications' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-black shadow">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="whitespace-nowrap"
                      >
                        {label}
                        {to === '/notifications' && unreadCount > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500/20 text-rose-400">
                            {unreadCount}
                          </span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip when collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-zinc-800 text-zinc-100 text-xs font-semibold rounded-lg whitespace-nowrap
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 border border-white/10 shadow-xl">
                      {label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-3 h-px bg-white/[0.06]" />

        {/* User section */}
        <div className="p-3 space-y-1">
          <div className={`flex items-center gap-2.5 px-2 py-2 rounded-xl ${collapsed ? 'justify-center' : ''}`}>
            <Avatar name={user?.email ?? '?'} />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-zinc-100 text-xs font-bold truncate">{username}</p>
                  {role && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${role.dot}`} />
                      <span className={`text-[10px] font-semibold ${role.color}`}>{role.label}</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handleLogout}
            className="group flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150 text-xs font-semibold border border-transparent hover:border-rose-500/20"
          >
            <LogOut size={15} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Se déconnecter
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-[60px] w-6 h-6 bg-zinc-800 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all shadow-lg z-30"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center px-8 shrink-0 shadow-sm">
          <div className="flex-1" />
          {/* Right side */}
          <div className="flex items-center gap-3">
            <NavLink to="/notifications"
              className="relative p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              )}
            </NavLink>
            <div className="w-px h-5 bg-slate-200" />
            <div className="flex items-center gap-2.5 pl-1">
              <Avatar name={user?.email ?? '?'} size="sm" />
              <div className="hidden sm:block">
                <p className="text-slate-700 text-xs font-bold leading-tight">{username}</p>
                {role && <p className={`text-[10px] font-semibold ${role.color.replace('text-', 'text-').replace('400', '500')}`}>{role.label}</p>}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
