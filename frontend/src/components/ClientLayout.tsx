import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Store, ShoppingCart, FileText, LogOut, Package, Bell, X, CheckCheck } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, type Notification } from '../api/notifications'

const NAV = [
  { to: '/shop',    label: 'Catalogue',      icon: Store },
  { to: '/orders',  label: 'Mes commandes',  icon: ShoppingCart },
  { to: '/billing', label: 'Mes factures',   icon: FileText },
]

const TYPE_LABEL: Record<string, string> = {
  ORDER_CREATED:        'Commande créée',
  ORDER_VALIDATED:      'Commande validée',
  ORDER_SHIPPED:        'En livraison',
  ORDER_DELIVERED:      'Livrée',
  ORDER_CANCELLED:      'Annulée',
  INVOICE_GENERATED:    'Facture disponible',
  INVOICE_PAID:         'Facture payée',
  SYSTEM:               'Système',
}

const TYPE_DOT: Record<string, string> = {
  ORDER_VALIDATED:   'bg-green-500',
  ORDER_SHIPPED:     'bg-blue-500',
  ORDER_DELIVERED:   'bg-teal-500',
  ORDER_CANCELLED:   'bg-red-500',
  INVOICE_GENERATED: 'bg-amber-500',
  INVOICE_PAID:      'bg-green-500',
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

  // Charger le compteur toutes les 30s
  useEffect(() => {
    const fetchCount = async () => {
      try { setUnreadCount(await getUnreadCount()) } catch { /* ignore */ }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  // Charger les notifications quand on ouvre le panneau
  useEffect(() => {
    if (notifOpen) {
      getNotifications().then(setNotifs).catch(() => {})
    }
  }, [notifOpen])

  // Fermer le panneau si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top header ── */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 flex items-center justify-center">
              <Package size={16} className="text-gray-900" />
            </div>
            <span className="font-bold text-white text-sm tracking-wide">
              SFMC <span className="text-amber-500">Bénin</span>
            </span>
          </div>

          {/* Nav tabs */}
          <nav className="hidden sm:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${
                    isActive
                      ? 'bg-amber-500 text-gray-900'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon size={15} />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right side: notif bell + user + logout */}
          <div className="flex items-center gap-2">

            {/* Cloche notifications */}
            <div className="relative" ref={panelRef}>
              <button
                onClick={() => setNotifOpen(v => !v)}
                className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-gray-900 text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1 leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Panneau déroulant */}
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
                  {/* Header du panneau */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAll}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                        >
                          <CheckCheck size={12} />
                          Tout lire
                        </button>
                      )}
                      <button
                        onClick={() => setNotifOpen(false)}
                        className="text-gray-500 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Liste */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
                    {notifs.length === 0 ? (
                      <div className="py-10 text-center text-gray-500 text-sm">
                        <Bell size={28} className="mx-auto mb-2 opacity-30" />
                        Aucune notification
                      </div>
                    ) : (
                      notifs.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 flex gap-3 transition-colors ${
                            n.read ? 'opacity-50' : 'bg-gray-800/40'
                          }`}
                        >
                          {/* Dot couleur */}
                          <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[n.type] || 'bg-gray-500'}`} />

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-amber-400">
                                {TYPE_LABEL[n.type] || n.type}
                              </span>
                              <span className="text-xs text-gray-500 shrink-0">{timeAgo(n.createdAt)}</span>
                            </div>
                            <p className="text-xs text-white font-medium mt-0.5 truncate">{n.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                          </div>

                          {!n.read && (
                            <button
                              onClick={() => handleMarkRead(n.id)}
                              className="shrink-0 text-xs text-gray-500 hover:text-amber-400 transition-colors mt-1"
                              title="Marquer comme lu"
                            >
                              <CheckCheck size={14} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {notifs.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-700 text-center">
                      <span className="text-xs text-gray-500">{notifs.length} notification(s) au total</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:block text-right">
              <p className="text-xs text-gray-400 leading-none">{user?.email}</p>
              <p className="text-xs text-amber-500 font-medium mt-0.5">Client</p>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 transition-colors text-sm p-2 rounded-lg hover:bg-gray-800"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="sm:hidden flex border-t border-gray-800">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                  isActive ? 'text-amber-500 bg-gray-800' : 'text-gray-500'
                }`
              }
            >
              <Icon size={18} />
              {label.replace('Mes ', '')}
            </NavLink>
          ))}
          {/* Cloche mobile */}
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-gray-500 relative"
          >
            <div className="relative">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-gray-900 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            Alertes
          </button>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © 2026 SFMC Bénin — Société de Fabrication de Matériaux de Construction
      </footer>
    </div>
  )
}
