import { useEffect, useState } from 'react'
import {
  getOrders, getMyOrders, createOrder, validateOrder, cancelOrder,
  createDelivery, confirmDelivery
} from '../api/orders'
import { getProducts } from '../api/products'
import { useAuth } from '../contexts/AuthContext'
import type { Order, CreateOrderRequest } from '../types'
import type { Product } from '../types'
import {
  Plus, CheckCircle, XCircle, X, Loader2, Eye,
  ShoppingCart, Trash2, Truck, Package,
  Clock, Zap, MapPin, ChevronRight, FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RefreshButton from '../components/RefreshButton'

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_STEPS   = ['PENDING', 'VALIDATED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED']
const STATUS_SHORT: Record<string, string> = {
  PENDING: 'Reçue', VALIDATED: 'Validée', IN_PRODUCTION: 'Production',
  SHIPPED: 'Expédiée', DELIVERED: 'Livrée',
}
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', VALIDATED: 'Validée', IN_PRODUCTION: 'En production',
  SHIPPED: 'En livraison', DELIVERED: 'Livrée', CANCELLED: 'Annulée',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING:       'bg-amber-100 text-amber-800 border-amber-200',
  VALIDATED:     'bg-blue-100 text-blue-800 border-blue-200',
  IN_PRODUCTION: 'bg-violet-100 text-violet-800 border-violet-200',
  SHIPPED:       'bg-indigo-100 text-indigo-800 border-indigo-200',
  DELIVERED:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED:     'bg-red-100 text-red-700 border-red-200',
}
const STATUS_DOT: Record<string, string> = {
  PENDING: 'bg-amber-400', VALIDATED: 'bg-blue-500', IN_PRODUCTION: 'bg-violet-500',
  SHIPPED: 'bg-indigo-500', DELIVERED: 'bg-emerald-500', CANCELLED: 'bg-red-500',
}

interface CartItem { product: Product; quantity: number }

// ─── Stepper component ────────────────────────────────────────────────────────
function OrderStepper({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 font-semibold">
        <XCircle size={13} /> Commande annulée
      </div>
    )
  }
  const currentIdx = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center">
      {STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i < currentIdx  ? 'bg-amber-500' :
              i === currentIdx ? 'bg-amber-400 ring-2 ring-amber-400/40 animate-pulse' :
                                 'bg-stone-200'
            }`} />
            <span className={`text-[9px] font-bold mt-1 whitespace-nowrap ${
              i <= currentIdx ? 'text-amber-600' : 'text-stone-400'
            }`}>{STATUS_SHORT[step]}</span>
          </div>
          {i < STATUS_STEPS.length - 1 && (
            <div className={`w-8 sm:w-12 h-[2px] mb-3.5 transition-all duration-300 ${
              i < currentIdx ? 'bg-amber-400' : 'bg-stone-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function OrdersPage() {
  const { user, hasRole } = useAuth()
  const isAdmin    = hasRole('ROLE_ADMIN')
  const isOperator = hasRole('ROLE_OPERATOR')
  const canManage  = isAdmin || isOperator

  const [orders, setOrders]     = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail]     = useState<Order | null>(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  const [shippingAddress, setShippingAddress] = useState('')
  const [notes, setNotes]         = useState('')
  const [cart, setCart]           = useState<CartItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity]   = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      const fetcher = canManage ? getOrders : getMyOrders
      setOrders(await fetcher() || [])
    } catch { setOrders([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    getProducts().then(setProducts).catch(() => setProducts([]))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const addToCart = () => {
    const prod = products.find(p => p.id === Number(selectedProductId))
    if (!prod) return
    setCart(prev => {
      const existing = prev.find(c => c.product.id === prod.id)
      if (existing) return prev.map(c => c.product.id === prod.id ? { ...c, quantity: c.quantity + quantity } : c)
      return [...prev, { product: prod, quantity }]
    })
    setSelectedProductId(''); setQuantity(1)
  }
  const removeFromCart = (id: number) => setCart(prev => prev.filter(c => c.product.id !== id))
  const updateQty      = (id: number, qty: number) =>
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: qty } : c))
  const total = cart.reduce((s, c) => s + c.product.unitPrice * c.quantity, 0)

  const handleCreate = async () => {
    if (cart.length === 0) { setError('Ajoutez au moins un produit.'); return }
    if (!shippingAddress.trim()) { setError("L'adresse de livraison est obligatoire."); return }
    setError(''); setSaving(true)
    try {
      await createOrder({
        clientEmail: user?.email, shippingAddress, notes,
        items: cart.map(c => ({
          productId: c.product.id, productName: c.product.name,
          quantity: c.quantity, unitPrice: c.product.unitPrice,
        })),
      } as CreateOrderRequest)
      setShowCreate(false); setCart([]); setShippingAddress(''); setNotes('')
      load()
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
      setError(`Erreur ${e?.response?.status ?? ''}: ${e?.response?.data?.message || e?.message || 'Erreur inconnue'}`)
    } finally { setSaving(false) }
  }

  const handleValidate = async (id: number) => {
    setSaving(true); setError('')
    try { await validateOrder(id); load() }
    catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(`Validation échouée : ${e?.response?.data?.message || e?.message}`)
    } finally { setSaving(false) }
  }

  const handleCancel = async (id: number) => {
    const reason = prompt("Motif d'annulation ?")
    if (reason === null) return
    setSaving(true); setError('')
    try { await cancelOrder(id, reason); load() }
    catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(`Annulation échouée : ${e?.response?.data?.message || e?.message}`)
    } finally { setSaving(false) }
  }

  const handleCreateDelivery = async (order: Order) => {
    const address = prompt('Adresse de livraison :', order.shippingAddress || '')
    if (address === null) return
    const agent = prompt('Nom du livreur (optionnel) :') ?? ''
    try {
      await createDelivery({ orderId: order.id, deliveryAddress: address || order.shippingAddress, deliveryAgent: agent || undefined })
      load()
    } catch { alert('Erreur lors de la création de la livraison.') }
  }

  const handleConfirmDelivery = async (orderId: number) => {
    if (!confirm('Confirmer la livraison de cette commande ?')) return
    try {
      const { getDeliveryByOrder } = await import('../api/orders')
      const delivery = await getDeliveryByOrder(orderId)
      await confirmDelivery(delivery.id); load()
    } catch { alert('Erreur lors de la confirmation.') }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN / OPERATOR VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (canManage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
            <p className="text-sm text-gray-500 mt-1">{orders.length} commande(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <RefreshButton onClick={load} loading={loading} />
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              <Plus size={16} /> Nouvelle commande
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={16} /></button>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : orders.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
              <p>Aucune commande</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {['N° Commande', 'Client', 'Montant', 'Adresse', 'Statut', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{o.clientName ?? o.clientEmail ?? `Client #${o.clientId}`}</td>
                      <td className="px-4 py-3 font-semibold text-blue-700">{o.totalAmount.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{o.shippingAddress || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[o.status]}`}>
                          {STATUS_LABELS[o.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setDetail(o)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Détails"><Eye size={15} /></button>
                          {o.status === 'PENDING' && (
                            <button onClick={() => handleValidate(o.id)} disabled={saving}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50" title="Valider">
                              {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                            </button>
                          )}
                          {o.status === 'VALIDATED' && (
                            <button onClick={() => handleCreateDelivery(o)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Créer livraison">
                              <Truck size={15} />
                            </button>
                          )}
                          {o.status === 'SHIPPED' && (
                            <button onClick={() => handleConfirmDelivery(o.id)} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Confirmer livraison">
                              <CheckCircle size={15} />
                            </button>
                          )}
                          {['PENDING', 'VALIDATED'].includes(o.status) && (
                            <button onClick={() => handleCancel(o.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Annuler">
                              <XCircle size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin modals (unchanged) */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h3 className="font-semibold text-gray-900 text-lg">Nouvelle commande</h3>
                <button onClick={() => { setShowCreate(false); setCart([]); setError('') }}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
                  Commande pour : <strong>{user?.email}</strong>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de livraison <span className="text-red-500">*</span></label>
                    <input type="text" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)}
                      placeholder="Ex : Quartier Cadjèhoun, Cotonou"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Ajouter des produits</h4>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">-- Choisir --</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.unitPrice.toLocaleString('fr-FR')} FCFA/{p.unit}</option>)}
                      </select>
                    </div>
                    <div className="w-24">
                      <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button onClick={addToCart} disabled={!selectedProductId}
                      className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm transition">
                      <Plus size={15} /> Ajouter
                    </button>
                  </div>
                </div>
                {cart.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>{['Produit', 'Prix unit.', 'Qté', 'Sous-total', ''].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-xs text-gray-500 font-medium">{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cart.map(c => (
                          <tr key={c.product.id}>
                            <td className="px-3 py-2 font-medium">{c.product.name}</td>
                            <td className="px-3 py-2 text-gray-600">{c.product.unitPrice.toLocaleString('fr-FR')}</td>
                            <td className="px-3 py-2">
                              <input type="number" min={1} value={c.quantity}
                                onChange={e => updateQty(c.product.id, Math.max(1, Number(e.target.value)))}
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center" />
                            </td>
                            <td className="px-3 py-2 font-semibold text-blue-700">{(c.product.unitPrice * c.quantity).toLocaleString('fr-FR')}</td>
                            <td className="px-3 py-2">
                              <button onClick={() => removeFromCart(c.product.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-sm font-semibold text-right">Total :</td>
                          <td className="px-3 py-2 font-bold text-blue-700">{total.toLocaleString('fr-FR')} FCFA</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
                {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
                <button onClick={() => { setShowCreate(false); setCart([]); setError('') }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">Annuler</button>
                <button onClick={handleCreate} disabled={saving || cart.length === 0}
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 font-medium">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Commander {cart.length > 0 && `(${total.toLocaleString('fr-FR')} FCFA)`}
                </button>
              </div>
            </div>
          </div>
        )}
        {detail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="font-semibold font-mono">{detail.orderNumber}</h3>
                  <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[detail.status]}`}>{STATUS_LABELS[detail.status]}</span>
                </div>
                <button onClick={() => setDetail(null)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">Client : </span><span className="font-medium">{detail.clientName ?? detail.clientEmail ?? `#${detail.clientId}`}</span></div>
                  <div><span className="text-gray-500">Montant : </span><span className="font-bold text-blue-700">{detail.totalAmount.toLocaleString('fr-FR')} FCFA</span></div>
                  <div><span className="text-gray-500">Adresse : </span><span>{detail.shippingAddress || '—'}</span></div>
                  {detail.notes && <div><span className="text-gray-500">Notes : </span><span>{detail.notes}</span></div>}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Articles ({detail.items?.length ?? 0})</h4>
                  <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr className="text-gray-500">
                        <th className="text-left px-3 py-2">Produit</th>
                        <th className="text-right px-3 py-2">Qté</th>
                        <th className="text-right px-3 py-2">Prix unit.</th>
                        <th className="text-right px-3 py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(detail.items ?? []).map(item => (
                        <tr key={item.id}>
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="text-right px-3 py-2">{item.quantity}</td>
                          <td className="text-right px-3 py-2">{item.unitPrice.toLocaleString('fr-FR')}</td>
                          <td className="text-right px-3 py-2 font-semibold">{(item.subtotal ?? item.quantity * item.unitPrice).toLocaleString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CLIENT VIEW — cards with status stepper
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Mes commandes</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {loading ? '…' : `${orders.length} commande${orders.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={load} loading={loading} />
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-stone-900 hover:bg-amber-500 hover:text-stone-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-md"
          >
            <Plus size={15} /> Nouvelle commande
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={16} /></button>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-6 animate-pulse h-36" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <ShoppingCart size={40} className="text-stone-300" />
          </div>
          <h2 className="text-xl font-black text-stone-700 mb-2">Aucune commande</h2>
          <p className="text-stone-400 text-sm mb-6">Vous n'avez pas encore passé de commande.</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-black px-6 py-3 rounded-2xl text-sm transition-colors shadow-lg shadow-amber-500/25">
            <Plus size={16} /> Passer ma première commande
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => (
            <motion.div key={order.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Card header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-stone-100">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[order.status] ?? 'bg-stone-400'}`} />
                  <div>
                    <p className="font-mono text-sm font-bold text-stone-800">{order.orderNumber}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(order.createdAt ?? '').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package size={10} />
                        {order.items?.length ?? 0} article{(order.items?.length ?? 0) > 1 ? 's' : ''}
                      </span>
                      {order.shippingAddress && (
                        <span className="hidden sm:flex items-center gap-1 max-w-[200px] truncate">
                          <MapPin size={10} />{order.shippingAddress}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-black text-stone-900">{order.totalAmount.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-stone-400 font-semibold">FCFA</p>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>

              {/* Stepper + actions */}
              <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="overflow-x-auto pb-1">
                  <OrderStepper status={order.status} />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {['PENDING', 'VALIDATED'].includes(order.status) && (
                    <button onClick={() => handleCancel(order.id)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100">
                      <XCircle size={12} /> Annuler
                    </button>
                  )}
                  <button onClick={() => setDetail(order)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors">
                    Détails <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Client create modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                <div>
                  <h3 className="font-black text-stone-900 text-lg">Nouvelle commande</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Sélectionnez vos produits et confirmez la livraison</p>
                </div>
                <button onClick={() => { setShowCreate(false); setCart([]); setError('') }}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400"><X size={18} /></button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                {/* Client chip */}
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
                  <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-stone-900">{(user?.email ?? 'U').slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-xs text-amber-700 font-semibold">Commande passée par</p>
                    <p className="text-sm font-bold text-stone-900">{user?.email}</p>
                  </div>
                </div>

                {/* Delivery info */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">
                      <MapPin size={12} className="inline mr-1" />Adresse de livraison <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={shippingAddress} onChange={e => setShippingAddress(e.target.value)}
                      placeholder="Ex : Quartier Cadjèhoun, Cotonou, Bénin"
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">
                      Notes <span className="text-stone-400 font-normal">(optionnel)</span>
                    </label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Référence chantier, instructions…"
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent" />
                  </div>
                </div>

                {/* Product picker */}
                <div>
                  <h4 className="text-sm font-bold text-stone-700 mb-3 flex items-center gap-2">
                    <Package size={13} className="text-amber-500" />Ajouter des produits
                  </h4>
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)}
                        className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white">
                        <option value="">— Choisir un produit —</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} — {p.unitPrice.toLocaleString('fr-FR')} FCFA/{p.unit}</option>
                        ))}
                      </select>
                    </div>
                    <input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-20 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-center font-bold" />
                    <button onClick={addToCart} disabled={!selectedProductId}
                      className="flex items-center gap-1 bg-stone-900 hover:bg-amber-500 hover:text-stone-900 disabled:bg-stone-200 disabled:text-stone-400 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all">
                      <Plus size={14} /> Ajouter
                    </button>
                  </div>
                </div>

                {/* Cart preview */}
                {cart.length > 0 && (
                  <div className="bg-stone-50 border border-stone-100 rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Panier</span>
                      <span className="text-sm font-black text-amber-600">{total.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    {cart.map(c => (
                      <div key={c.product.id} className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-stone-900 truncate">{c.product.name}</p>
                          <p className="text-xs text-stone-400">{c.product.unitPrice.toLocaleString('fr-FR')} FCFA/{c.product.unit}</p>
                        </div>
                        <input type="number" min={1} value={c.quantity}
                          onChange={e => updateQty(c.product.id, Math.max(1, Number(e.target.value)))}
                          className="w-16 border border-stone-200 bg-white rounded-lg px-2 py-1 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-amber-400" />
                        <span className="w-28 text-right text-sm font-black text-stone-900 shrink-0">
                          {(c.product.unitPrice * c.quantity).toLocaleString('fr-FR')} FCFA
                        </span>
                        <button onClick={() => removeFromCart(c.product.id)} className="text-stone-300 hover:text-red-400 p-1 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                    <X size={14} className="shrink-0 mt-0.5" /> {error}
                  </div>
                )}
              </div>

              <div className="flex gap-3 px-6 py-5 border-t border-stone-100">
                <button onClick={() => { setShowCreate(false); setCart([]); setError('') }}
                  className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                  Annuler
                </button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={handleCreate} disabled={saving || cart.length === 0}
                  className="flex-1 py-3 bg-stone-900 hover:bg-amber-500 hover:text-stone-900 disabled:opacity-50 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg">
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Envoi…' : `Commander${cart.length > 0 ? ` · ${total.toLocaleString('fr-FR')} FCFA` : ''}`}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client detail modal */}
      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="flex items-start justify-between px-6 py-5 border-b border-stone-100">
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Commande</p>
                  <h3 className="font-mono text-lg font-black text-stone-900">{detail.orderNumber}</h3>
                  <span className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[detail.status]}`}>
                    {STATUS_LABELS[detail.status]}
                  </span>
                </div>
                <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* Progress */}
                <div className="bg-stone-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Suivi de commande</p>
                  <div className="overflow-x-auto"><OrderStepper status={detail.status} /></div>
                </div>
                {/* Info cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                    <p className="text-xs text-amber-600 font-semibold mb-1 flex items-center gap-1"><Zap size={10} />Total TTC</p>
                    <p className="text-xl font-black text-stone-900">{detail.totalAmount.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-stone-400 font-semibold">FCFA</p>
                  </div>
                  {detail.shippingAddress && (
                    <div className="bg-stone-50 border border-stone-100 rounded-xl p-3">
                      <p className="text-xs text-stone-500 font-semibold mb-1 flex items-center gap-1"><MapPin size={10} />Livraison</p>
                      <p className="text-xs text-stone-700 font-medium leading-relaxed">{detail.shippingAddress}</p>
                    </div>
                  )}
                </div>
                {/* Items */}
                <div>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText size={11} />Articles ({detail.items?.length ?? 0})
                  </p>
                  <div className="space-y-2">
                    {(detail.items ?? []).map(item => (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3 bg-stone-50 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-stone-900">{item.productName}</p>
                          <p className="text-xs text-stone-400">{item.unitPrice.toLocaleString('fr-FR')} FCFA × {item.quantity}</p>
                        </div>
                        <p className="text-sm font-black text-stone-900">
                          {(item.subtotal ?? item.quantity * item.unitPrice).toLocaleString('fr-FR')} FCFA
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                {detail.notes && (
                  <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                    <p className="text-xs font-semibold text-blue-600 mb-0.5">Notes</p>
                    <p className="text-sm text-stone-700">{detail.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
