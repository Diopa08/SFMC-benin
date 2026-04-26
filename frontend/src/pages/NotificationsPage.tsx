import { useEffect, useState } from 'react'
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '../api/notifications'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import RefreshButton from '../components/RefreshButton'

const TYPE_COLOR: Record<string, string> = {
  ORDER_CREATED:        'bg-blue-100 text-blue-700',
  ORDER_VALIDATED:      'bg-green-100 text-green-700',
  ORDER_SHIPPED:        'bg-indigo-100 text-indigo-700',
  ORDER_DELIVERED:      'bg-teal-100 text-teal-700',
  ORDER_CANCELLED:      'bg-red-100 text-red-700',
  STOCK_LOW:            'bg-orange-100 text-orange-700',
  STOCK_UPDATED:        'bg-yellow-100 text-yellow-700',
  PRODUCTION_STARTED:   'bg-purple-100 text-purple-700',
  PRODUCTION_COMPLETED: 'bg-green-100 text-green-700',
  INVOICE_GENERATED:    'bg-blue-100 text-blue-700',
  INVOICE_PAID:         'bg-green-100 text-green-700',
  SYSTEM:               'bg-gray-100 text-gray-700',
}

const TYPE_LABEL: Record<string, string> = {
  ORDER_CREATED:        'Commande créée',
  ORDER_VALIDATED:      'Commande validée',
  ORDER_SHIPPED:        'Commande expédiée',
  ORDER_DELIVERED:      'Commande livrée',
  ORDER_CANCELLED:      'Commande annulée',
  STOCK_LOW:            'Stock bas',
  STOCK_UPDATED:        'Stock mis à jour',
  PRODUCTION_STARTED:   'Production démarrée',
  PRODUCTION_COMPLETED: 'Production terminée',
  INVOICE_GENERATED:    'Facture générée',
  INVOICE_PAID:         'Facture payée',
  SYSTEM:               'Système',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = async () => {
    setLoading(true)
    try { setNotifs(await getNotifications()) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleRead = async (id: number) => {
    await markAsRead(id)
    setNotifs(prev => prev.map(n => n.id === id ? {...n, read: true} : n))
  }

  const handleReadAll = async () => {
    await markAllAsRead()
    setNotifs(prev => prev.map(n => ({...n, read: true})))
  }

  const displayed = filter === 'unread' ? notifs.filter(n => !n.read) : notifs
  const unreadCount = notifs.filter(n => !n.read).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Bell size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est lu'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={load} loading={loading} />
          {unreadCount > 0 && (
            <button onClick={handleReadAll}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition">
              <CheckCheck size={16} /> Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4">
        {(['all', 'unread'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
            {f === 'all' ? 'Toutes' : 'Non lues'}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 bg-white text-indigo-600 text-xs px-1.5 py-0.5 rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          <Bell size={40} className="mx-auto mb-3 opacity-30" />
          <p>Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map(n => (
            <div key={n.id}
              className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition ${
                n.read ? 'border-gray-100 opacity-70' : 'border-indigo-200 shadow-sm'
              }`}>
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLOR[n.type] || 'bg-gray-100 text-gray-600'}`}>
                  {TYPE_LABEL[n.type] || n.type}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && (
                <button onClick={() => handleRead(n.id)}
                  className="flex-shrink-0 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">
                  Lu
                </button>
              )}
              {!n.read && (
                <span className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
