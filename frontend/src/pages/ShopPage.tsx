import { useEffect, useState, useCallback } from 'react'
import { getProducts } from '../api/products'
import { createOrder } from '../api/orders'
import { useAuth } from '../contexts/AuthContext'
import type { Product, CreateOrderRequest } from '../types'
import {
  ShoppingCart, Plus, Minus, Trash2, X, Loader2,
  CheckCircle, Search, Package, ArrowRight, Tag
} from 'lucide-react'
import RefreshButton from '../components/RefreshButton'

interface CartItem { product: Product; quantity: number }

// Couleurs par catégorie
const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  'Ciment':    { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400' },
  'Sable':     { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-400' },
  'Gravier':   { bg: 'bg-stone-50',   text: 'text-stone-700',   dot: 'bg-stone-400' },
  'Brique':    { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400' },
  'Acier':     { bg: 'bg-slate-50',   text: 'text-slate-700',   dot: 'bg-slate-400' },
  'default':   { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400' },
}
const getCat = (cat?: string) => CATEGORY_COLORS[cat ?? ''] ?? CATEGORY_COLORS['default']

// Icône par catégorie
function ProductIcon({ category }: { category?: string }) {
  const colors: Record<string, string> = {
    'Ciment': '#f97316', 'Sable': '#eab308', 'Gravier': '#a8a29e',
    'Brique': '#ef4444', 'Acier': '#64748b',
  }
  const color = colors[category ?? ''] ?? '#3b82f6'
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 80 80" fill="none" style={{ width: 56, height: 56 }}>
        <rect x="10" y="30" width="60" height="36" rx="3" fill={color} opacity=".15" />
        <rect x="20" y="20" width="40" height="12" rx="2" fill={color} opacity=".25" />
        <rect x="28" y="12" width="24" height="10" rx="2" fill={color} opacity=".35" />
        <rect x="16" y="38" width="16" height="20" rx="2" fill={color} opacity=".4" />
        <rect x="36" y="38" width="28" height="20" rx="2" fill={color} opacity=".3" />
      </svg>
    </div>
  )
}

const CART_KEY = 'sfmc_cart'

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export default function ShopPage() {
  const { user } = useAuth()
  const [products, setProducts]   = useState<Product[]>([])
  const [filtered, setFiltered]   = useState<Product[]>([])
  const [cart, setCart]           = useState<CartItem[]>(loadCart)
  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('all')
  const [loading, setLoading]     = useState(true)
  const [cartOpen, setCartOpen]   = useState(false)
  const [checkout, setCheckout]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')
  const [address, setAddress]     = useState('')
  const [notes, setNotes]         = useState('')

  // Persist cart to localStorage on every change
  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)) } catch { /* ignore */ }
  }, [cart])

  const load = useCallback(() => {
    setLoading(true)
    getProducts()
      .then(p => { setProducts(p); setFiltered(p) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    let r = products
    if (search) r = r.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    )
    if (category !== 'all') r = r.filter(p => p.category === category)
    setFiltered(r)
  }, [search, category, products])

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
  const addToCart = (p: Product) => setCart(prev => {
    const ex = prev.find(c => c.product.id === p.id)
    return ex ? prev.map(c => c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c)
              : [...prev, { product: p, quantity: 1 }]
  })
  const updateQty = (id: number, d: number) =>
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: Math.max(0, c.quantity + d) } : c).filter(c => c.quantity > 0))
  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.product.id !== id))
  const getQty = (id: number) => cart.find(c => c.product.id === id)?.quantity ?? 0
  const total = cart.reduce((s, c) => s + c.product.unitPrice * c.quantity, 0)
  const count = cart.reduce((s, c) => s + c.quantity, 0)

  const handleOrder = async () => {
    if (!address.trim()) { setError("L'adresse de livraison est obligatoire."); return }
    setError(''); setSaving(true)
    try {
      await createOrder({
        clientEmail: user?.email,
        shippingAddress: address, notes,
        items: cart.map(c => ({
          productId: c.product.id, productName: c.product.name,
          quantity: c.quantity, unitPrice: c.product.unitPrice,
        })),
      } as CreateOrderRequest)
      setSuccess(true)
      setCart([])
      try { localStorage.removeItem(CART_KEY) } catch { /* ignore */ }
      setAddress(''); setNotes('')
      setTimeout(() => { setSuccess(false); setCheckout(false); setCartOpen(false) }, 3500)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      const msg = err?.response?.data?.message || err?.message || 'Erreur lors de la commande.'
      setError(msg)
    } finally { setSaving(false) }
  }

  return (
    <div>
      {/* ── Hero de bienvenue ── */}
      <div className="bg-gray-900 rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#C89520 0,#C89520 1px,transparent 0,transparent 50%)', backgroundSize: '12px 12px' }} />
        <div className="relative flex items-center justify-between gap-6">
          <div>
            <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">Bienvenue</p>
            <h1 className="text-2xl font-bold text-white mb-1">
              {user?.email?.split('@')[0]}
            </h1>
            <p className="text-gray-400 text-sm">
              {products.length} produit{products.length > 1 ? 's' : ''} disponible{products.length > 1 ? 's' : ''} — passez votre commande en quelques clics
            </p>
            <div className="mt-3">
              <RefreshButton onClick={load} loading={loading} className="border-gray-600 bg-gray-800 text-gray-300 hover:border-amber-400 hover:text-amber-400" />
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex-shrink-0 flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Mon panier</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filtres ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher un produit..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                category === cat
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {cat !== 'all' && <span className={`w-2 h-2 rounded-full ${getCat(cat).dot}`} />}
              {cat === 'all' ? 'Tous' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grille produits ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={32} className="animate-spin text-amber-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 font-medium">Aucun produit trouvé</p>
          <p className="text-gray-400 text-sm mt-1">Essayez de modifier votre recherche</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => {
            const qty = getQty(product.id)
            const cat = getCat(product.category)
            return (
              <div key={product.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Image / Illustration */}
                <div className={`h-36 ${cat.bg} relative`}>
                  <ProductIcon category={product.category} />
                  {product.category && (
                    <span className={`absolute top-3 left-3 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm ${cat.text}`}>
                      <Tag size={10} />
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2 flex-1">{product.description}</p>
                  )}
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-xl font-extrabold text-gray-900">
                      {product.unitPrice.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">FCFA / {product.unit}</span>
                  </div>

                  {qty === 0 ? (
                    <button onClick={() => addToCart(product)}
                      className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors group-hover:bg-amber-500 group-hover:text-gray-900"
                    >
                      <Plus size={15} /> Ajouter au panier
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-1.5">
                      <button onClick={() => updateQty(product.id, -1)}
                        className="w-8 h-8 rounded-lg bg-white border border-amber-200 hover:bg-amber-100 text-amber-700 flex items-center justify-center transition-colors shadow-sm">
                        <Minus size={14} />
                      </button>
                      <span className="font-extrabold text-amber-700 text-sm min-w-[2rem] text-center">{qty}</span>
                      <button onClick={() => updateQty(product.id, +1)}
                        className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center transition-colors shadow-sm">
                        <Plus size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Panier (drawer) ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-md bg-white shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className="text-gray-700" />
                <span className="font-bold text-gray-900">Mon panier</span>
                {count > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {count} article{count > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <ShoppingCart size={48} className="text-gray-200 mb-4" />
                  <p className="text-gray-500 font-medium">Votre panier est vide</p>
                  <p className="text-gray-400 text-sm mt-1">Ajoutez des produits pour commencer</p>
                </div>
              ) : cart.map(c => (
                <div key={c.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-12 h-12 rounded-lg flex-shrink-0 ${getCat(c.product.category).bg} flex items-center justify-center`}>
                    <Package size={18} className={getCat(c.product.category).text} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.product.name}</p>
                    <p className="text-xs text-gray-400">{c.product.unitPrice.toLocaleString('fr-FR')} FCFA / {c.product.unit}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(c.product.id, -1)}
                      className="w-6 h-6 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center">
                      <Minus size={11} />
                    </button>
                    <span className="w-7 text-center text-sm font-bold">{c.quantity}</span>
                    <button onClick={() => updateQty(c.product.id, +1)}
                      className="w-6 h-6 rounded-lg bg-gray-900 text-white hover:bg-gray-700 flex items-center justify-center">
                      <Plus size={11} />
                    </button>
                  </div>
                  <div className="text-right min-w-[5rem]">
                    <p className="font-bold text-sm text-gray-900">{(c.product.unitPrice * c.quantity).toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-gray-400">FCFA</p>
                  </div>
                  <button onClick={() => removeItem(c.product.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t p-5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total estimé</span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-gray-900">{total.toLocaleString('fr-FR')}</span>
                    <span className="text-sm text-gray-400 ml-1">FCFA</span>
                  </div>
                </div>
                <button
                  onClick={() => { setCartOpen(false); setCheckout(true) }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Passer la commande <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal commande ── */}
      {checkout && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-bold text-gray-900 text-lg">Confirmer la commande</h3>
              <button onClick={() => setCheckout(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {success ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Commande envoyée !</h4>
                <p className="text-gray-500 text-sm">Votre commande a été transmise. Vous serez notifié à chaque étape.</p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Récap */}
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Récapitulatif — {cart.length} produit{cart.length > 1 ? 's' : ''}
                  </p>
                  {cart.map(c => (
                    <div key={c.product.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{c.product.name} <span className="text-gray-400">× {c.quantity}</span></span>
                      <span className="font-semibold">{(c.product.unitPrice * c.quantity).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-3 mt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-amber-600">{total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Adresse de livraison <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                    placeholder="Ex : Quartier Cadjèhoun, Cotonou, Bénin"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes <span className="text-gray-400 font-normal">(optionnel)</span></label>
                  <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Instructions spéciales, référence chantier..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
                )}

                <div className="flex gap-3 pt-1">
                  <button onClick={() => setCheckout(false)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                    Retour
                  </button>
                  <button onClick={handleOrder} disabled={saving}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-gray-900 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                    {saving && <Loader2 size={14} className="animate-spin" />}
                    Confirmer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
