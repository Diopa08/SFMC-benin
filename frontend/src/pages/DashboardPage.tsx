import { useEffect, useState, useCallback } from 'react'
import { getProducts } from '../api/products'
import { getOrders, getMyOrders } from '../api/orders'
import { getInvoices, getMyInvoices } from '../api/billing'
import { getStocks } from '../api/inventory'
import { useAuth } from '../contexts/AuthContext'
import {
  Package, ShoppingCart, FileText, Warehouse,
  TrendingUp, AlertTriangle, Clock, CheckCircle,
  ArrowUpRight, Zap, BarChart3, CircleDot,
  type LucideIcon
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Order, Invoice, Stock } from '../types'
import RefreshButton from '../components/RefreshButton'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  PENDING:       'bg-amber-100 text-amber-700',
  VALIDATED:     'bg-sky-100 text-sky-700',
  IN_PRODUCTION: 'bg-violet-100 text-violet-700',
  SHIPPED:       'bg-indigo-100 text-indigo-700',
  DELIVERED:     'bg-emerald-100 text-emerald-700',
  CANCELLED:     'bg-slate-100 text-slate-500',
}
const statusLabels: Record<string, string> = {
  PENDING: 'En attente', VALIDATED: 'Validée', IN_PRODUCTION: 'En production',
  SHIPPED: 'En livraison', DELIVERED: 'Livrée', CANCELLED: 'Annulée',
}
const statusDot: Record<string, string> = {
  PENDING: 'bg-amber-400', VALIDATED: 'bg-sky-400', IN_PRODUCTION: 'bg-violet-400',
  SHIPPED: 'bg-indigo-400', DELIVERED: 'bg-emerald-400', CANCELLED: 'bg-slate-400',
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

function formatDate() {
  return new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, gradient, sub, to, delay = 0,
}: {
  label: string; value: number | string; icon: LucideIcon
  gradient: string; sub?: string; to: string; delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    >
      <Link to={to} className="group block bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon size={18} className="text-white" />
          </div>
          <ArrowUpRight size={15} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
        </div>
        <p className="text-3xl font-black text-slate-900 leading-none mb-1">{value}</p>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
      </Link>
    </motion.div>
  )
}

// ─── Alert Card ──────────────────────────────────────────────────────────────

function AlertCard({
  icon: Icon, title, value, color, sub, to, delay = 0,
}: {
  icon: LucideIcon; title: string; value: number; color: string; sub: string; to: string; delay?: number
}) {
  const colorMap: Record<string, { bg: string; border: string; text: string; icon: string; val: string }> = {
    amber: { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', icon: 'text-amber-500', val: 'text-amber-900' },
    red:   { bg: 'bg-rose-50',  border: 'border-rose-100',  text: 'text-rose-700',  icon: 'text-rose-500',  val: 'text-rose-900'  },
    violet:{ bg: 'bg-violet-50',border: 'border-violet-100',text: 'text-violet-700',icon: 'text-violet-500',val: 'text-violet-900'},
  }
  const c = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: 'easeOut' }}
    >
      <Link to={to} className={`group flex items-center gap-4 p-4 rounded-2xl border ${c.bg} ${c.border} hover:shadow-sm transition-all duration-150`}>
        <div className={`w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center shadow-sm`}>
          <Icon size={18} className={c.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold uppercase tracking-wide ${c.text}`}>{title}</p>
          <p className={`text-2xl font-black ${c.val} leading-tight`}>{value}</p>
          <p className={`text-[10px] ${c.text} opacity-70`}>{sub}</p>
        </div>
        <ArrowUpRight size={14} className={`${c.icon} opacity-0 group-hover:opacity-100 transition-opacity`} />
      </Link>
    </motion.div>
  )
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{
    products: number; orders: number; invoices: number; stocks: number
    revenue: number; pendingOrders: number; lowStock: number; unpaidInvoices: number
    pendingPayments: number
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

        const revenue         = (invoices as Invoice[]).filter(inv => inv.status === 'PAID').reduce((acc, inv) => acc + inv.totalAmount, 0)
        const pendingOrders   = (orders as Order[]).filter(ord => ord.status === 'PENDING').length
        const lowStock        = (stocks as Stock[]).filter(st => st.quantity <= st.threshold).length
        const unpaidInvoices  = (invoices as Invoice[]).filter(inv => inv.status === 'UNPAID' || inv.status === 'OVERDUE').length
        const pendingPayments = (invoices as Invoice[]).filter(inv => inv.status === 'PENDING_PAYMENT').length

        setStats({ products: products.length, orders: orders.length, invoices: invoices.length, stocks: stocks.length, revenue, pendingOrders, lowStock, unpaidInvoices, pendingPayments })
        setRecentOrders((orders as Order[]).slice(0, 6))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const username = user?.email?.split('@')[0] ?? 'Admin'

  if (loading) return <Loader />

  return (
    <div className="space-y-8">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <motion.p
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1"
          >
            {formatDate()}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="text-2xl font-black text-slate-900"
          >
            {greeting()}, <span className="text-indigo-600">{username}</span> 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="text-slate-500 text-sm mt-1"
          >
            Voici l'activité de SFMC Bénin aujourd'hui.
          </motion.p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {/* ── Revenue Hero ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-7 overflow-hidden shadow-xl"
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp size={14} className="text-emerald-400" />
              </div>
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Chiffre d'affaires</span>
            </div>
            <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {(stats?.revenue ?? 0).toLocaleString('fr-FR')}
            </p>
            <p className="text-slate-400 font-bold mt-1">FCFA encaissés</p>
          </div>

          <div className="flex gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-2xl font-black text-white">{stats?.orders ?? 0}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Commandes</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">{stats?.invoices ?? 0}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Factures</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-black text-white">{stats?.products ?? 0}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">Produits</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Produits"  value={stats?.products ?? 0}  icon={Package}      gradient="bg-gradient-to-br from-sky-500 to-blue-600"       to="/products"      delay={0.12} />
        <StatCard label="Commandes" value={stats?.orders ?? 0}    icon={ShoppingCart} gradient="bg-gradient-to-br from-violet-500 to-purple-600"   to="/orders-admin"  delay={0.16} />
        <StatCard label="Factures"  value={stats?.invoices ?? 0}  icon={FileText}     gradient="bg-gradient-to-br from-emerald-500 to-teal-600"    to="/billing-admin" delay={0.20} />
        <StatCard label="Stocks"    value={stats?.stocks ?? 0}    icon={Warehouse}    gradient="bg-gradient-to-br from-orange-500 to-amber-600"    to="/inventory"     delay={0.24} sub="références" />
      </div>

      {/* ── Alert Cards ────────────────────────────────────────────────────── */}
      {((stats?.pendingOrders ?? 0) + (stats?.lowStock ?? 0) + (stats?.unpaidInvoices ?? 0) + (stats?.pendingPayments ?? 0) > 0) && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Zap size={12} className="text-amber-400" /> Points d'attention
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(stats?.pendingOrders ?? 0) > 0 && (
              <AlertCard icon={Clock}         title="Commandes en attente" value={stats!.pendingOrders}   color="amber"  sub="à traiter"              to="/orders-admin"  delay={0.28} />
            )}
            {(stats?.lowStock ?? 0) > 0 && (
              <AlertCard icon={AlertTriangle} title="Stocks critiques"     value={stats!.lowStock}        color="red"    sub="sous le seuil"          to="/inventory"     delay={0.30} />
            )}
            {(stats?.unpaidInvoices ?? 0) > 0 && (
              <AlertCard icon={FileText}      title="Factures impayées"    value={stats!.unpaidInvoices}  color="amber"  sub="UNPAID / OVERDUE"       to="/billing-admin" delay={0.32} />
            )}
            {(stats?.pendingPayments ?? 0) > 0 && (
              <AlertCard icon={CheckCircle}   title="Paiements à confirmer" value={stats!.pendingPayments} color="violet" sub="déclarés par les clients" to="/billing-admin" delay={0.34} />
            )}
          </div>
        </div>
      )}

      {/* ── Recent Orders ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <BarChart3 size={14} className="text-indigo-500" />
            </div>
            <h2 className="font-black text-slate-900">Commandes récentes</h2>
          </div>
          <Link to="/orders-admin"
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            Voir tout <ArrowUpRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
              <ShoppingCart size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Aucune commande pour l'instant</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.38 + i * 0.04 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors"
              >
                {/* Order number */}
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <ShoppingCart size={14} className="text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-bold text-slate-700">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400 truncate">{order.clientName ?? order.clientEmail ?? `Client #${order.clientId}`}</p>
                </div>
                <p className="font-bold text-slate-900 text-sm whitespace-nowrap">
                  {order.totalAmount.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-400">FCFA</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot[order.status] ?? 'bg-slate-400'}`} />
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[order.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 whitespace-nowrap hidden lg:block">
                  {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ─── User Dashboard ───────────────────────────────────────────────────────────

function UserDashboard() {
  const { user } = useAuth()
  const [orders, setOrders]     = useState<Order[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading]   = useState(true)

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
  const username       = user?.email?.split('@')[0] ?? 'vous'

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">{formatDate()}</p>
          <h1 className="text-2xl font-black text-slate-900">
            {greeting()}, <span className="text-indigo-600">{username}</span> 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">Bienvenue dans votre espace client.</p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mes commandes"     value={orders.length}    icon={ShoppingCart}  gradient="bg-gradient-to-br from-sky-500 to-blue-600"     to="/orders"  delay={0.08} />
        <StatCard label="En cours"          value={activeOrders}     icon={CircleDot}     gradient="bg-gradient-to-br from-violet-500 to-purple-600" to="/orders"  delay={0.12} />
        <StatCard label="En attente"        value={pendingOrders}    icon={Clock}         gradient="bg-gradient-to-br from-amber-500 to-orange-600"  to="/orders"  delay={0.16} />
        <StatCard label="Factures impayées" value={unpaidInvoices}   icon={FileText}      gradient="bg-gradient-to-br from-rose-500 to-pink-600"    to="/billing" delay={0.20} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
          <Link to="/shop"
            className="group relative flex items-center gap-5 p-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Package size={22} className="text-white" />
            </div>
            <div className="relative">
              <p className="font-black text-white text-lg leading-tight">Catalogue</p>
              <p className="text-indigo-200 text-xs font-medium mt-0.5">Parcourir et commander</p>
            </div>
            <ArrowUpRight size={16} className="ml-auto text-white/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
          <Link to="/billing"
            className="group relative flex items-center gap-5 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <FileText size={22} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg leading-tight">Mes factures</p>
              <p className="text-slate-400 text-xs font-medium mt-0.5">Consulter et régler</p>
            </div>
            <ArrowUpRight size={16} className="ml-auto text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        </motion.div>
      </div>

      {/* Unpaid alert */}
      {unpaidInvoices > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Link to="/billing"
            className="group flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={18} className="text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                {unpaidInvoices} facture{unpaidInvoices > 1 ? 's' : ''} en attente de paiement
              </p>
              <p className="text-xs text-amber-600">Cliquez pour régler via Mobile Money, virement ou espèces.</p>
            </div>
            <ArrowUpRight size={14} className="text-amber-400 group-hover:text-amber-600 transition-colors" />
          </Link>
        </motion.div>
      )}

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ShoppingCart size={14} className="text-indigo-500" />
            </div>
            <h2 className="font-black text-slate-900">Mes commandes récentes</h2>
          </div>
          <Link to="/orders" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
            Voir tout <ArrowUpRight size={12} />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
              <ShoppingCart size={24} className="text-slate-300" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Aucune commande pour l'instant</p>
            <Link to="/shop" className="text-xs font-bold text-indigo-600 hover:underline">Parcourir le catalogue →</Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order, i) => (
              <motion.div key={order.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.34 + i * 0.04 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-bold text-slate-700">{order.orderNumber}</p>
                  <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                </div>
                <p className="font-bold text-slate-900 text-sm whitespace-nowrap">
                  {order.totalAmount.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-400">FCFA</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusDot[order.status] ?? 'bg-slate-400'}`} />
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColors[order.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Recent invoices */}
      {recentInvoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                <FileText size={14} className="text-emerald-500" />
              </div>
              <h2 className="font-black text-slate-900">Mes factures récentes</h2>
            </div>
            <Link to="/billing" className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
              Voir tout <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {recentInvoices.map((inv, i) => (
              <motion.div key={inv.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.42 + i * 0.04 }}
                className="flex items-center gap-4 px-6 py-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-bold text-slate-700">{inv.invoiceNumber}</p>
                  {inv.orderNumber && <p className="text-xs text-slate-400">Cmd : {inv.orderNumber}</p>}
                </div>
                <p className="font-bold text-slate-900 text-sm whitespace-nowrap">
                  {inv.totalAmount.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-slate-400">FCFA</span>
                </p>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  inv.status === 'PAID'            ? 'bg-emerald-100 text-emerald-700' :
                  inv.status === 'OVERDUE'         ? 'bg-rose-100 text-rose-700' :
                  inv.status === 'PENDING_PAYMENT' ? 'bg-violet-100 text-violet-700' :
                                                     'bg-amber-100 text-amber-700'
                }`}>
                  {inv.status === 'PAID' ? 'Payée' : inv.status === 'OVERDUE' ? 'En retard' : inv.status === 'PENDING_PAYMENT' ? 'En vérif.' : 'Impayée'}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Delivered orders */}
      {orders.filter(o => o.status === 'DELIVERED').length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.46 }}
          className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <p className="text-sm text-emerald-800">
            <strong>{orders.filter(o => o.status === 'DELIVERED').length}</strong> commande(s) livrée(s) avec succès.
          </p>
        </motion.div>
      )}
    </div>
  )
}

// ─── Loader ───────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-3 w-32 bg-slate-200 rounded-full animate-pulse" />
        <div className="h-8 w-64 bg-slate-200 rounded-xl animate-pulse" />
      </div>
      <div className="h-36 bg-slate-200 rounded-3xl animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white border border-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-white border border-slate-100 rounded-2xl animate-pulse" />
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { isUser } = useAuth()
  return isUser() ? <UserDashboard /> : <AdminDashboard />
}
