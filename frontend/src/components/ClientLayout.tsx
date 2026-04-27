import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Store, ShoppingCart, FileText, LogOut, Bell, X, CheckCheck, Building2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, type Notification } from '../api/notifications'

const NAV = [
  { to: '/shop',    label: 'Catalogue',   icon: Store },
  { to: '/orders',  label: 'Commandes',   icon: ShoppingCart },
  { to: '/billing', label: 'Factures',    icon: FileText },
]

const TYPE_LABEL: Record<string, string> = {
  ORDER_CREATED:     'Commande créée',
  ORDER_VALIDATED:   'Commande validée',
  ORDER_SHIPPED:     'En livraison',
  ORDER_DELIVERED:   'Livrée',
  ORDER_CANCELLED:   'Annulée',
  INVOICE_GENERATED: 'Facture disponible',
  INVOICE_PAID:      'Facture payée',
  SYSTEM:            'Système',
}

const TYPE_COLOR: Record<string, { dot: string; text: string }> = {
  ORDER_CREATED:     { dot: 'bg-blue-500',    text: 'text-blue-400' },
  ORDER_VALIDATED:   { dot: 'bg-green-500',   text: 'text-green-400' },
  ORDER_SHIPPED:     { dot: 'bg-indigo-500',  text: 'text-indigo-400' },
  ORDER_DELIVERED:   { dot: 'bg-teal-500',    text: 'text-teal-400' },
  ORDER_CANCELLED:   { dot: 'bg-red-500',     text: 'text-red-400' },
  INVOICE_GENERATED: { dot: 'bg-amber-500',   text: 'text-amber-400' },
  INVOICE_PAID:      { dot: 'bg-emerald-500', text: 'text-emerald-400' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}j`
}

export default function ClientLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const [notifOpen, setNotifOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetch = async () => {
      try { setUnreadCount(await getUnreadCount()) } catch { /* ignore */ }
    }
    fetch()
    const iv = setInterval(fetch, 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    if (notifOpen) getNotifications().then(setNotifs).catch(() => {})
  }, [notifOpen])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setNotifOpen(false)
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const handleMarkRead = async (id: number) => {
    await markAsRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const handleMarkAll = async () => {
    await markAllAsRead()
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleLogout = () => { signOut(); navigate('/login') }

  const initials = (user?.email ?? 'U').slice(0, 2).toUpperCase()
  const username = user?.email?.split('@')[0] ?? ''

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* ── Amber accent bar ── */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 z-[60]" />

      {/* ── Header ── */}
      <header className="fixed top-[3px] left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <NavLink to="/shop" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 group-hover:scale-105 transition-transform duration-200">
              <Building2 size={17} className="text-stone-900" />
            </div>
            <div>
              <span className="font-black text-white text-sm tracking-tight">SFMC</span>
              <span className="font-black text-amber-400 text-sm"> Bénin</span>
            </div>
          </NavLink>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center p-1 bg-stone-900 rounded-2xl border border-white/5 gap-0.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-amber-500 text-stone-900 shadow-md shadow-amber-500/30'
                      : 'text-stone-400 hover:text-white hover:bg-stone-800'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-1.5">

            {/* Bell */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-black px-1 ring-2 ring-stone-950 animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-80 bg-stone-950 border border-white/8 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
                  >
                    {/* Panel header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/6">
                      <div className="flex items-center gap-2">
                        <Bell size={13} className="text-amber-400" />
                        <span className="text-sm font-bold text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="bg-amber-500 text-stone-900 text-xs font-black px-1.5 py-0.5 rounded-full leading-none">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAll} className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors font-semibold">
                            <CheckCheck size={12} /> Tout lire
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} className="p-1 text-stone-600 hover:text-white rounded-lg hover:bg-stone-800 transition-colors">
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[340px] overflow-y-auto divide-y divide-white/5">
                      {notifs.length === 0 ? (
                        <div className="py-10 text-center">
                          <Bell size={26} className="mx-auto mb-2 text-stone-700" />
                          <p className="text-stone-500 text-sm">Aucune notification</p>
                        </div>
                      ) : notifs.slice(0, 12).map(n => {
                        const c = TYPE_COLOR[n.type] ?? { dot: 'bg-stone-500', text: 'text-stone-400' }
                        return (
                          <div key={n.id}
                            className={`px-4 py-3 flex gap-3 transition-colors ${n.read ? 'opacity-40' : 'hover:bg-stone-900/60'}`}
                          >
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${c.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className={`text-xs font-bold ${c.text}`}>{TYPE_LABEL[n.type] || n.type}</span>
                                <span className="text-xs text-stone-600 shrink-0">{timeAgo(n.createdAt)}</span>
                              </div>
                              <p className="text-xs text-stone-200 font-semibold truncate">{n.title}</p>
                              <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                            </div>
                            {!n.read && (
                              <button onClick={() => handleMarkRead(n.id)}
                                className="shrink-0 mt-1 text-stone-600 hover:text-amber-400 transition-colors"
                                title="Marquer comme lu"
                              >
                                <CheckCheck size={13} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {notifs.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-white/5 text-center">
                        <span className="text-xs text-stone-600">{notifs.length} notification(s) au total</span>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2.5 bg-stone-900 border border-white/5 rounded-xl px-3 py-2 ml-1">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-stone-900">{initials}</span>
              </div>
              <div className="leading-none">
                <p className="text-xs font-semibold text-stone-200 max-w-[90px] truncate">{username}</p>
                <p className="text-[10px] text-amber-400 font-bold mt-0.5 uppercase tracking-wide">Client</p>
              </div>
            </div>

            {/* Logout */}
            <button onClick={handleLogout}
              className="p-2.5 rounded-xl text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
              title="Déconnexion"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Spacer */}
      <div className="h-[67px]" />

      {/* Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-stone-950 border-t border-white/5 py-6 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <Building2 size={13} className="text-stone-900" />
            </div>
            <span className="font-black text-white text-sm">SFMC <span className="text-amber-400">Bénin</span></span>
          </div>
          <p className="text-stone-600 text-xs text-center">
            © 2026 — Société de Fabrication de Matériaux de Construction
          </p>
          <div className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
            Tous les services opérationnels
          </div>
        </div>
      </footer>

      {/* Mobile bottom nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-stone-950/95 backdrop-blur-xl border-t border-white/5 flex">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive ? 'text-amber-400' : 'text-stone-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-amber-500/15' : ''}`}>
                  <Icon size={18} />
                </div>
                <span className="text-[10px] font-bold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <button
          onClick={() => setNotifOpen(v => !v)}
          className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-stone-600"
        >
          <div className="relative p-1.5 rounded-xl">
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center font-black ring-2 ring-stone-950">
                {unreadCount > 9 ? '9' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tracking-wide">Alertes</span>
        </button>
      </nav>
      <div className="sm:hidden h-[68px]" />
    </div>
  )
}
