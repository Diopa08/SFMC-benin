import { useEffect, useState, useCallback } from 'react'
import { getProducts } from '../api/products'
import { getOrders, getMyOrders } from '../api/orders'
import { getInvoices, getMyInvoices } from '../api/billing'
import { getStocks } from '../api/inventory'
import { useAuth } from '../contexts/AuthContext'
import {
  Package, ShoppingCart, FileText, Warehouse,
  TrendingUp, AlertTriangle, Clock, CheckCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Order, Invoice, Stock } from '../types'
import RefreshButton from '../components/RefreshButton'

const statusColors: Record<string, string> = {
  PENDING:       'bg-yellow-100 text-yellow-800',
  VALIDATED:     'bg-blue-100 text-blue-800',
  IN_PRODUCTION: 'bg-purple-100 text-purple-800',
  SHIPPED:       'bg-indigo-100 text-indigo-800',
  DELIVERED:     'bg-green-100 text-green-800',
  CANCELLED:     'bg-red-100 text-red-800',
}
const statusLabels: Record<string, string> = {
  PENDING: 'En attente', VALIDATED: 'Validée', IN_PRODUCTION: 'En production',
  SHIPPED: 'En livraison', DELIVERED: 'Livrée', CANCELLED: 'Annulée',
}

function StatCard({ label, value, icon: Icon, color, to }: {
  label: string; value: number | string; icon: React.ElementType; color: string; to: string
}) {
  return (
    <Link to={to} className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </Link>
  )
}

// ─── Dashboard Admin / Opérateur ─────────────────────────────────────────────

function AdminDashboard() {
  const [stats, setStats] = useState<{
    products: number; orders: number; invoices: number; stocks: number
    revenue: number; pendingOrders: number; lowStock: number; unpaidInvoices: number
  } | null>(null)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.allSettled([getProducts(), getOrders(), getInvoices(), getStocks()])
      .then(([p, o, i, s]) => {
        const products = p.status === 'fulfilled' ? p.value : []
        const orders   = o.status === 'fulfilled' ? o.value : []
        const invoices = i.status === 'fulfilled' ? i.value : []
        const stocks   = s.status === 'fulfilled' ? s.value : []

        const revenue        = (invoices as Invoice[]).filter(inv => inv.status === 'PAID').reduce((acc, inv) => acc + inv.totalAmount, 0)
        const pendingOrders  = (orders as Order[]).filter(ord => ord.status === 'PENDING').length
        const lowStock       = (stocks as Stock[]).filter(st => st.quantity <= st.threshold).length
        const unpaidInvoices = (invoices as Invoice[]).filter(inv => inv.status === 'UNPAID' || inv.status === 'OVERDUE').length

        setStats({
          products: products.length, orders: orders.length,
          invoices: invoices.length, stocks: stocks.length,
          revenue, pendingOrders, lowStock, unpaidInvoices,
        })
        setRecentOrders((orders as Order[]).slice(0, 5))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de l'activité</p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Produits"  value={stats?.products ?? 0}  icon={Package}      color="bg-blue-500"   to="/products" />
        <StatCard label="Commandes" value={stats?.orders ?? 0}    icon={ShoppingCart} color="bg-purple-500" to="/orders" />
        <StatCard label="Factures"  value={stats?.invoices ?? 0}  icon={FileText}     color="bg-green-500"  to="/billing" />
        <StatCard label="Stocks"    value={stats?.stocks ?? 0}    icon={Warehouse}    color="bg-orange-500" to="/inventory" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-green-500">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Revenu total</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{(stats?.revenue ?? 0).toLocaleString('fr-FR')} FCFA</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Clock size={18} />
            <span className="text-sm font-medium">Commandes en attente</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{stats?.pendingOrders ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-red-500">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <AlertTriangle size={18} />
            <span className="text-sm font-medium">Stocks bas</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{stats?.lowStock ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-orange-500">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <FileText size={18} />
            <span className="text-sm font-medium">Factures impayées</span>
          </div>
          <p className="text-xl font-bold text-gray-800">{stats?.unpaidInvoices ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Commandes récentes</h2>
          <Link to="/orders" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucune commande</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">N° Commande</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="py-3 text-gray-600 text-xs">{order.clientName ?? order.clientEmail ?? `Client #${order.clientId}`}</td>
                    <td className="py-3 font-medium">{order.totalAmount.toLocaleString('fr-FR')} FCFA</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard Utilisateur (ROLE_USER) ───────────────────────────────────────

function UserDashboard() {
  const { user } = useAuth()
  const [orders, setOrders]   = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    Promise.allSettled([getMyOrders(), getMyInvoices()])
      .then(([o, i]) => {
        setOrders(o.status === 'fulfilled' ? (o.value ?? []) : [])
        setInvoices(i.status === 'fulfilled' ? (i.value ?? []) : [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Loader />

  const pendingOrders  = orders.filter(o => o.status === 'PENDING').length
  const activeOrders   = orders.filter(o => ['VALIDATED', 'SHIPPED', 'IN_PRODUCTION'].includes(o.status)).length
  const unpaidInvoices = invoices.filter(i => i.status === 'UNPAID' || i.status === 'OVERDUE').length
  const recentOrders   = orders.slice(0, 5)
  const recentInvoices = invoices.slice(0, 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon espace</h1>
          <p className="text-gray-500 text-sm mt-1">Bienvenue, <strong>{user?.email}</strong></p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {/* KPI utilisateur */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mes commandes"       value={orders.length}    icon={ShoppingCart} color="bg-blue-500"   to="/orders" />
        <StatCard label="En cours"            value={activeOrders}     icon={Clock}        color="bg-purple-500" to="/orders" />
        <StatCard label="En attente"          value={pendingOrders}    icon={AlertTriangle} color="bg-yellow-500" to="/orders" />
        <StatCard label="Factures impayées"   value={unpaidInvoices}   icon={FileText}     color="bg-red-500"    to="/billing" />
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/shop" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 flex items-center gap-4 transition-colors">
          <Package size={32} className="opacity-80" />
          <div>
            <p className="font-bold text-lg">Catalogue produits</p>
            <p className="text-blue-100 text-sm">Parcourez et commandez nos produits</p>
          </div>
        </Link>
        <Link to="/orders" className="bg-white hover:shadow-md border border-gray-200 rounded-xl p-6 flex items-center gap-4 transition-shadow">
          <ShoppingCart size={32} className="text-purple-500" />
          <div>
            <p className="font-bold text-lg text-gray-800">Mes commandes</p>
            <p className="text-gray-500 text-sm">Suivez l'état de vos commandes</p>
          </div>
        </Link>
      </div>

      {/* Commandes récentes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Mes commandes récentes</h2>
          <Link to="/orders" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <ShoppingCart size={36} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400 text-sm">Vous n'avez pas encore de commandes.</p>
            <Link to="/shop" className="mt-3 inline-block text-blue-600 text-sm hover:underline">
              Parcourir le catalogue →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">N° Commande</th>
                  <th className="pb-3 font-medium">Montant</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="py-3 font-semibold text-blue-700">{order.totalAmount.toLocaleString('fr-FR')} FCFA</td>
                    <td className="py-3 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Factures récentes */}
      {recentInvoices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Mes factures récentes</h2>
            <Link to="/billing" className="text-sm text-blue-600 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {recentInvoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-mono text-xs font-medium text-gray-800">{inv.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{inv.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-blue-700">{inv.totalAmount.toLocaleString('fr-FR')} FCFA</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    inv.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {inv.status === 'PAID' ? 'Payée' : inv.status === 'OVERDUE' ? 'En retard' : 'Impayée'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rappel factures impayées */}
      {unpaidInvoices > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle size={20} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-orange-800">
              {unpaidInvoices} facture{unpaidInvoices > 1 ? 's' : ''} en attente de paiement
            </p>
            <Link to="/billing" className="text-sm text-orange-600 hover:underline">Voir mes factures →</Link>
          </div>
        </div>
      )}

      {/* Livraisons confirmées */}
      {orders.filter(o => o.status === 'DELIVERED').length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-500 mt-0.5 shrink-0" />
          <p className="text-green-800 text-sm">
            <strong>{orders.filter(o => o.status === 'DELIVERED').length}</strong> commande(s) livrée(s) avec succès.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isUser } = useAuth()
  return isUser() ? <UserDashboard /> : <AdminDashboard />
}
