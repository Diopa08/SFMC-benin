import { useEffect, useState } from 'react'
import { getOrders, getMyOrders, createOrder, validateOrder, cancelOrder, createDelivery, confirmDelivery } from '../api/orders'
import { getProducts } from '../api/products'
import { useAuth } from '../contexts/AuthContext'
import type { Order, CreateOrderRequest } from '../types'
import type { Product } from '../types'
import { Plus, CheckCircle, XCircle, X, Loader2, Eye, ShoppingCart, Trash2, Truck } from 'lucide-react'
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

interface CartItem {
  product: Product
  quantity: number
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

  // Formulaire simplifié
  const [shippingAddress, setShippingAddress] = useState('')
  const [notes, setNotes]       = useState('')
  const [cart, setCart]         = useState<CartItem[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)

  const load = async () => {
    setLoading(true)
    try {
      // ROLE_USER → uniquement ses propres commandes (sécurité côté backend aussi)
      const fetcher = canManage ? getOrders : getMyOrders
      setOrders(await fetcher() || [])
    }
    catch { setOrders([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    getProducts().then(setProducts).catch(() => setProducts([]))
  }, [])

  const addToCart = () => {
    const prod = products.find(p => p.id === Number(selectedProductId))
    if (!prod) return
    setCart(prev => {
      const existing = prev.find(c => c.product.id === prod.id)
      if (existing) return prev.map(c => c.product.id === prod.id ? { ...c, quantity: c.quantity + quantity } : c)
      return [...prev, { product: prod, quantity }]
    })
    setSelectedProductId('')
    setQuantity(1)
  }

  const removeFromCart = (productId: number) =>
    setCart(prev => prev.filter(c => c.product.id !== productId))

  const updateQty = (productId: number, qty: number) =>
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, quantity: qty } : c))

  const total = cart.reduce((sum, c) => sum + c.product.unitPrice * c.quantity, 0)

  const handleCreate = async () => {
    if (cart.length === 0) { setError('Ajoutez au moins un produit au panier.'); return }
    if (!shippingAddress.trim()) { setError("L'adresse de livraison est obligatoire."); return }
    setError('')
    setSaving(true)

    const req: CreateOrderRequest = {
      clientEmail: user?.email,
      shippingAddress,
      notes,
      items: cart.map(c => ({
        productId:   c.product.id,
        productName: c.product.name,
        quantity:    c.quantity,
        unitPrice:   c.product.unitPrice,
      })),
    }

    try {
      await createOrder(req)
      setShowCreate(false)
      setCart([])
      setShippingAddress('')
      setNotes('')
      load()
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string }
      const status = e?.response?.status
      const msg = e?.response?.data?.message || e?.message || 'Erreur inconnue'
      setError(`Erreur ${status ?? ''} : ${msg}`)
    }
    finally { setSaving(false) }
  }

  const handleValidate = async (id: number) => {
    setSaving(true)
    setError('')
    try {
      await validateOrder(id)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const msg = e?.response?.data?.message || e?.message || 'Erreur inconnue'
      setError(`Validation échouée : ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id: number) => {
    const reason = prompt('Motif d\'annulation ?')
    if (reason === null) return
    setSaving(true)
    setError('')
    try {
      await cancelOrder(id, reason)
      load()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setError(`Annulation échouée : ${e?.response?.data?.message || e?.message || 'Erreur inconnue'}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDelivery = async (order: Order) => {
    const address = prompt('Adresse de livraison :', order.shippingAddress || '')
    if (address === null) return
    const agent = prompt('Nom du livreur (optionnel) :') ?? ''
    try {
      await createDelivery({
        orderId: order.id,
        deliveryAddress: address || order.shippingAddress,
        deliveryAgent: agent || undefined,
      })
      load()
    } catch { alert('Erreur lors de la création de la livraison.') }
  }

  const handleConfirmDelivery = async (orderId: number) => {
    if (!confirm('Confirmer la livraison de cette commande ?')) return
    try {
      // On doit d'abord récupérer l'ID de la livraison via /deliveries/order/{orderId}
      const { getDeliveryByOrder } = await import('../api/orders')
      const delivery = await getDeliveryByOrder(orderId)
      await confirmDelivery(delivery.id)
      load()
    } catch { alert('Erreur lors de la confirmation de la livraison.') }
  }

  // Le backend filtre déjà par utilisateur — displayedOrders = toutes les commandes reçues
  const displayedOrders = orders

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-sm text-gray-500 mt-1">{displayedOrders.length} commande(s)</p>
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
          <button onClick={() => setError('')} className="ml-4 text-red-400 hover:text-red-600"><X size={16} /></button>
        </div>
      )}

      {/* Liste des commandes */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : displayedOrders.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune commande</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>{['N° Commande', canManage ? 'Client' : null, 'Montant', 'Adresse', 'Statut', 'Actions']
                  .filter(Boolean).map(h => (
                  <th key={h!} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayedOrders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{o.orderNumber}</td>
                    {canManage && <td className="px-4 py-3 text-gray-600">{o.clientName ?? o.clientEmail ?? `Client #${o.clientId}`}</td>}
                    <td className="px-4 py-3 font-semibold text-blue-700">
                      {o.totalAmount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{o.shippingAddress || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[o.status]}`}>
                        {statusLabels[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setDetail(o)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Détails">
                          <Eye size={15} />
                        </button>
                        {canManage && o.status === 'PENDING' && (
                          <button onClick={() => handleValidate(o.id)} disabled={saving}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50" title="Valider">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                          </button>
                        )}
                        {canManage && o.status === 'VALIDATED' && (
                          <button onClick={() => handleCreateDelivery(o)}
                            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Créer livraison">
                            <Truck size={15} />
                          </button>
                        )}
                        {canManage && o.status === 'SHIPPED' && (
                          <button onClick={() => handleConfirmDelivery(o.id)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Confirmer livraison">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {['PENDING', 'VALIDATED'].includes(o.status) && (
                          <button onClick={() => handleCancel(o.id)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Annuler">
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

      {/* ── Modal : Nouvelle commande ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900 text-lg">Nouvelle commande</h3>
              <button onClick={() => { setShowCreate(false); setCart([]); setError('') }}>
                <X size={20} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {/* Info client (lecture seule) */}
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-800">
                Commande pour : <strong>{user?.email}</strong>
              </div>

              {/* Adresse + Notes */}
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse de livraison <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    placeholder="Ex : Quartier Cadjèhoun, Cotonou, Bénin"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
                  <input type="text" value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Instructions de livraison, référence chantier..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Sélecteur de produit */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Ajouter des produits</h4>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Produit</label>
                    <select value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">-- Choisir un produit --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.unitPrice.toLocaleString('fr-FR')} FCFA / {p.unit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-xs text-gray-500 mb-1">Quantité</label>
                    <input type="number" min={1} value={quantity}
                      onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <button onClick={addToCart} disabled={!selectedProductId}
                    className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm font-medium transition">
                    <Plus size={15} /> Ajouter
                  </button>
                </div>
              </div>

              {/* Panier */}
              {cart.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Panier</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">Produit</th>
                          <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">Prix unit.</th>
                          <th className="px-3 py-2 text-center text-xs text-gray-500 font-medium">Qté</th>
                          <th className="px-3 py-2 text-right text-xs text-gray-500 font-medium">Sous-total</th>
                          <th className="px-3 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {cart.map(c => (
                          <tr key={c.product.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-900">{c.product.name}</div>
                              <div className="text-xs text-gray-400">{c.product.category}</div>
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600">
                              {c.product.unitPrice.toLocaleString('fr-FR')} FCFA
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input type="number" min={1} value={c.quantity}
                                onChange={e => updateQty(c.product.id, Math.max(1, Number(e.target.value)))}
                                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-center" />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-blue-700">
                              {(c.product.unitPrice * c.quantity).toLocaleString('fr-FR')} FCFA
                            </td>
                            <td className="px-3 py-2">
                              <button onClick={() => removeFromCart(c.product.id)}
                                className="text-red-400 hover:text-red-600 transition">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                        <tr>
                          <td colSpan={3} className="px-3 py-2 text-sm font-semibold text-gray-700 text-right">Total :</td>
                          <td className="px-3 py-2 text-right font-bold text-blue-700 text-base">
                            {total.toLocaleString('fr-FR')} FCFA
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setShowCreate(false); setCart([]); setError('') }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                Annuler
              </button>
              <button onClick={handleCreate} disabled={saving || cart.length === 0}
                className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2 transition font-medium">
                {saving && <Loader2 size={14} className="animate-spin" />}
                Passer la commande {cart.length > 0 && `(${total.toLocaleString('fr-FR')} FCFA)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal détail commande */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="font-semibold">{detail.orderNumber}</h3>
                <span className={`mt-1 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[detail.status]}`}>
                  {statusLabels[detail.status]}
                </span>
              </div>
              <button onClick={() => setDetail(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {canManage && <div><span className="text-gray-500">Client :</span> <span className="font-medium">{detail.clientName ?? detail.clientEmail ?? `#${detail.clientId}`}</span></div>}
                <div><span className="text-gray-500">Montant :</span> <span className="font-bold text-blue-700">{detail.totalAmount.toLocaleString('fr-FR')} FCFA</span></div>
                <div><span className="text-gray-500">Adresse :</span> <span>{detail.shippingAddress || '—'}</span></div>
                {detail.notes && <div><span className="text-gray-500">Notes :</span> <span>{detail.notes}</span></div>}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Articles ({detail.items.length})</h4>
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
                    {detail.items.map(item => (
                      <tr key={item.id}>
                        <td className="px-3 py-2">{item.productName}</td>
                        <td className="text-right px-3 py-2">{item.quantity}</td>
                        <td className="text-right px-3 py-2">{item.unitPrice.toLocaleString('fr-FR')}</td>
                        <td className="text-right px-3 py-2 font-semibold">
                          {(item.subtotal ?? item.quantity * item.unitPrice).toLocaleString('fr-FR')}
                        </td>
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
