import { useEffect, useState, useCallback } from 'react'
import { getProducts } from '../api/products'
import { createOrder } from '../api/orders'
import { useAuth } from '../contexts/AuthContext'
import type { Product, CreateOrderRequest } from '../types'
import {
  ShoppingCart, Plus, Minus, Trash2, X, Loader2,
  CheckCircle, Search, Package, ArrowRight, Tag,
  Sparkles, SlidersHorizontal
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RefreshButton from '../components/RefreshButton'

interface CartItem { product: Product; quantity: number }

const CATEGORY_COLORS: Record<string, { border: string; badge: string; badgeText: string; icon: string }> = {
  'Ciment':  { border: 'border-orange-400', badge: 'bg-orange-100', badgeText: 'text-orange-700', icon: '#f97316' },
  'Sable':   { border: 'border-yellow-400', badge: 'bg-yellow-100', badgeText: 'text-yellow-700', icon: '#eab308' },
  'Gravier': { border: 'border-stone-400',  badge: 'bg-stone-100',  badgeText: 'text-stone-700',  icon: '#a8a29e' },
  'Brique':  { border: 'border-red-400',    badge: 'bg-red-100',    badgeText: 'text-red-700',    icon: '#ef4444' },
  'Acier':   { border: 'border-slate-400',  badge: 'bg-slate-100',  badgeText: 'text-slate-700',  icon: '#64748b' },
  'default': { border: 'border-blue-400',   badge: 'bg-blue-100',   badgeText: 'text-blue-700',   icon: '#3b82f6' },
}
const getCat = (cat?: string) => CATEGORY_COLORS[cat ?? ''] ?? CATEGORY_COLORS['default']

function ProductIllustration({ category, color }: { category?: string; color: string }) {
  return (
    <svg viewBox="0 0 100 80" fill="none" style={{ width: 72, height: 58 }}>
      {/* Shadow */}
      <ellipse cx="50" cy="74" rx="28" ry="4" fill={color} opacity=".12" />
      {/* Base stack */}
      <rect x="12" y="38" width="76" height="30" rx="4" fill={color} opacity=".12" />
      <rect x="20" y="26" width="60" height="14" rx="3" fill={color} opacity=".20" />
      <rect x="30" y="14" width="40" height="14" rx="3" fill={color} opacity=".30" />
      {/* Top highlight */}
      <rect x="34" y="16" width="32" height="3" rx="1.5" fill="white" opacity=".35" />
      {/* Category dots */}
      {category === 'Ciment' && (
        <>
          <circle cx="38" cy="50" r="3" fill={color} opacity=".5" />
          <circle cx="50" cy="50" r="3" fill={color} opacity=".5" />
          <circle cx="62" cy="50" r="3" fill={color} opacity=".5" />
        </>
      )}
      {category === 'Acier' && (
        <>
          <rect x="24" y="46" width="52" height="3" rx="1.5" fill={color} opacity=".4" />
          <rect x="24" y="53" width="52" height="3" rx="1.5" fill={color} opacity=".4" />
        </>
      )}
    </svg>
  )
}

const CART_KEY = 'sfmc_cart'
function loadCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(CART_KEY) ?? '[]') } catch { return [] }
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
  const addToCart  = (p: Product) => setCart(prev => {
    const ex = prev.find(c => c.product.id === p.id)
    return ex ? prev.map(c => c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c)
              : [...prev, { product: p, quantity: 1 }]
  })
  const updateQty  = (id: number, d: number) =>
    setCart(prev => prev.map(c => c.product.id === id ? { ...c, quantity: Math.max(0, c.quantity + d) } : c).filter(c => c.quantity > 0))
  const removeItem = (id: number) => setCart(prev => prev.filter(c => c.product.id !== id))
  const getQty     = (id: number) => cart.find(c => c.product.id === id)?.quantity ?? 0
  const total      = cart.reduce((s, c) => s + c.product.unitPrice * c.quantity, 0)
  const count      = cart.reduce((s, c) => s + c.quantity, 0)

  const handleOrder = async () => {
    if (!address.trim()) { setError("L'adresse de livraison est obligatoire."); return }
    setError(''); setSaving(true)
    try {
      await createOrder({
        clientEmail: user?.email, shippingAddress: address, notes,
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
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de la commande.')
    } finally { setSaving(false) }
  }

  return (
    <div className="space-y-6">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-3xl bg-stone-900 p-8">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#f59e0b 0,#f59e0b 1px,transparent 0,transparent 50%)', backgroundSize: '14px 14px' }} />
        {/* Glow */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">Matériaux de construction</span>
            </div>
            <h1 className="text-3xl font-black text-white leading-tight mb-2">
              Bonjour, <span className="text-amber-400">{user?.email?.split('@')[0]}</span> 👋
            </h1>
            <p className="text-stone-400 text-sm leading-relaxed">
              {loading ? '…' : `${products.length} produit${products.length > 1 ? 's' : ''} disponible${products.length > 1 ? 's' : ''}`}
              {' '}— commandez en quelques clics, livraison directe sur chantier.
            </p>
            <div className="mt-4">
              <RefreshButton onClick={load} loading={loading}
                className="border-stone-700 bg-stone-800 text-stone-300 hover:border-amber-500 hover:text-amber-400" />
            </div>
          </div>

          {/* Cart button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setCartOpen(true)}
            className="relative shrink-0 flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold px-6 py-3.5 rounded-2xl transition-colors shadow-xl shadow-amber-500/30 text-sm"
          >
            <ShoppingCart size={18} />
            <span>Mon panier</span>
            {count > 0 && (
              <motion.span
                key={count}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-black ring-2 ring-stone-900"
              >
                {count > 9 ? '9+' : count}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="sticky top-[67px] z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-stone-50/90 backdrop-blur-md border-b border-stone-200/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text" placeholder="Rechercher un produit…"
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-stone-400 shadow-sm"
            />
          </div>
          {/* Category pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlidersHorizontal size={14} className="text-stone-400 shrink-0 mr-1" />
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                  category === cat
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900'
                }`}
              >
                {cat !== 'all' && (
                  <span className={`w-2 h-2 rounded-full ${getCat(cat).border.replace('border-', 'bg-')}`} />
                )}
                {cat === 'all' ? 'Tous les produits' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 h-64 animate-pulse">
              <div className="h-32 bg-stone-100 rounded-t-2xl" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-2/3" />
                <div className="h-3 bg-stone-100 rounded w-full" />
                <div className="h-3 bg-stone-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Package size={36} className="text-stone-300" />
          </div>
          <p className="text-stone-700 font-bold text-lg">Aucun produit trouvé</p>
          <p className="text-stone-400 text-sm mt-1">Essayez de modifier votre recherche ou vos filtres</p>
          <button onClick={() => { setSearch(''); setCategory('all') }}
            className="mt-4 text-amber-600 text-sm font-semibold hover:underline">
            Réinitialiser les filtres
          </button>
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((product, i) => {
            const qty = getQty(product.id)
            const cat = getCat(product.category)
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className={`group bg-white rounded-2xl border-l-4 ${cat.border} border border-stone-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-250 flex flex-col overflow-hidden cursor-default`}
              >
                {/* Illustration area */}
                <div className="h-36 bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center relative">
                  <ProductIllustration category={product.category} color={cat.icon} />
                  {product.category && (
                    <span className={`absolute top-3 right-3 flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full ${cat.badge} ${cat.badgeText}`}>
                      <Tag size={9} />
                      {product.category}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-black text-stone-900 text-sm mb-1 leading-tight">{product.name}</h3>
                  {product.description && (
                    <p className="text-xs text-stone-400 mb-3 line-clamp-2 flex-1 leading-relaxed">{product.description}</p>
                  )}
                  {!product.description && <div className="flex-1" />}

                  {/* Price */}
                  <div className="flex items-baseline gap-1 mb-3.5">
                    <span className="text-2xl font-black text-stone-900">
                      {product.unitPrice.toLocaleString('fr-FR')}
                    </span>
                    <span className="text-xs text-stone-400 font-semibold">FCFA / {product.unit}</span>
                  </div>

                  {/* Cart control */}
                  <AnimatePresence mode="wait">
                    {qty === 0 ? (
                      <motion.button
                        key="add"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => addToCart(product)}
                        whileTap={{ scale: 0.97 }}
                        className="w-full flex items-center justify-center gap-2 bg-stone-900 group-hover:bg-amber-500 group-hover:text-stone-900 text-white py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
                      >
                        <Plus size={14} /> Ajouter au panier
                      </motion.button>
                    ) : (
                      <motion.div
                        key="stepper"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl p-1.5"
                      >
                        <button onClick={() => updateQty(product.id, -1)}
                          className="w-8 h-8 rounded-lg bg-white border border-amber-200 hover:bg-red-50 hover:border-red-300 text-stone-600 flex items-center justify-center transition-colors shadow-sm">
                          <Minus size={13} />
                        </button>
                        <span className="font-black text-amber-700 text-sm min-w-[2rem] text-center">{qty}</span>
                        <button onClick={() => updateQty(product.id, +1)}
                          className="w-8 h-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center transition-colors shadow-sm">
                          <Plus size={13} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* ── Cart drawer ── */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 bg-black/50 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="w-full max-w-md bg-white shadow-2xl flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-black text-stone-900 text-base">Mon panier</h2>
                    {count > 0 && (
                      <p className="text-xs text-stone-400 font-medium">{count} article{count > 1 ? 's' : ''}</p>
                    )}
                  </div>
                </div>
                <button onClick={() => setCartOpen(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Items */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                    <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mb-4">
                      <ShoppingCart size={32} className="text-stone-300" />
                    </div>
                    <p className="text-stone-600 font-bold">Votre panier est vide</p>
                    <p className="text-stone-400 text-sm mt-1">Parcourez le catalogue pour ajouter des produits</p>
                    <button onClick={() => setCartOpen(false)}
                      className="mt-4 text-amber-600 text-sm font-semibold hover:underline">
                      Voir le catalogue →
                    </button>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map(c => {
                      const cat = getCat(c.product.category)
                      return (
                        <motion.div
                          key={c.product.id}
                          initial={{ opacity: 0, x: 16 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          className="flex items-center gap-3 p-3.5 bg-stone-50 rounded-2xl border border-stone-100"
                        >
                          <div className={`w-11 h-11 rounded-xl flex-shrink-0 bg-white border ${cat.border} flex items-center justify-center`}>
                            <Package size={16} className={cat.badgeText} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-stone-900 truncate">{c.product.name}</p>
                            <p className="text-xs text-stone-400">{c.product.unitPrice.toLocaleString('fr-FR')} FCFA/{c.product.unit}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => updateQty(c.product.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 flex items-center justify-center transition-colors shadow-sm">
                              <Minus size={11} />
                            </button>
                            <span className="w-6 text-center text-sm font-black text-stone-900">{c.quantity}</span>
                            <button onClick={() => updateQty(c.product.id, +1)}
                              className="w-7 h-7 rounded-lg bg-stone-900 text-white hover:bg-amber-500 flex items-center justify-center transition-colors shadow-sm">
                              <Plus size={11} />
                            </button>
                          </div>
                          <div className="text-right min-w-[4.5rem] shrink-0">
                            <p className="font-black text-sm text-stone-900">{(c.product.unitPrice * c.quantity).toLocaleString('fr-FR')}</p>
                            <p className="text-xs text-stone-400">FCFA</p>
                          </div>
                          <button onClick={() => removeItem(c.product.id)}
                            className="text-stone-300 hover:text-red-400 transition-colors shrink-0 p-1">
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              {cart.length > 0 && (
                <div className="border-t border-stone-100 p-5 space-y-4">
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-stone-500 text-sm font-medium">Sous-total</span>
                      <span className="text-stone-900 font-bold">{total.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-400 text-xs">TVA 18% incluse</span>
                      <span className="text-stone-500 text-xs">{(total * 0.18).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA</span>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setCartOpen(false); setCheckout(true) }}
                    className="w-full bg-stone-900 hover:bg-amber-500 hover:text-stone-900 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-200 text-sm shadow-lg"
                  >
                    Passer la commande <ArrowRight size={16} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Checkout modal ── */}
      <AnimatePresence>
        {checkout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100">
                <div>
                  <h3 className="font-black text-stone-900 text-lg">Confirmer la commande</h3>
                  <p className="text-xs text-stone-400 mt-0.5">{cart.length} produit{cart.length > 1 ? 's' : ''} sélectionné{cart.length > 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => setCheckout(false)}
                  className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 text-center"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <CheckCircle size={36} className="text-green-500" />
                  </div>
                  <h4 className="text-xl font-black text-stone-900 mb-2">Commande envoyée !</h4>
                  <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto">
                    Votre commande a été transmise à nos équipes. Vous recevrez une notification à chaque étape.
                  </p>
                </motion.div>
              ) : (
                <div className="p-6 space-y-5">
                  {/* Order summary */}
                  <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Récapitulatif</p>
                    <div className="space-y-2">
                      {cart.map(c => (
                        <div key={c.product.id} className="flex items-center justify-between text-sm">
                          <span className="text-stone-600">
                            {c.product.name}
                            <span className="text-stone-400 ml-1">× {c.quantity}</span>
                          </span>
                          <span className="font-bold text-stone-900">
                            {(c.product.unitPrice * c.quantity).toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-stone-200 mt-3 pt-3 flex justify-between items-center">
                      <span className="font-bold text-stone-700 text-sm">Total TTC</span>
                      <span className="text-xl font-black text-amber-600">{total.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>

                  {/* Delivery address */}
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">
                      Adresse de livraison <span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                      placeholder="Ex : Quartier Cadjèhoun, Cotonou, Bénin"
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">
                      Notes <span className="text-stone-400 font-normal">(optionnel)</span>
                    </label>
                    <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Instructions spéciales, référence chantier…"
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                      <X size={14} className="shrink-0 mt-0.5" />
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => setCheckout(false)}
                      className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                      Retour
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleOrder}
                      disabled={saving}
                      className="flex-1 py-3 bg-stone-900 hover:bg-amber-500 hover:text-stone-900 disabled:opacity-60 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm shadow-lg"
                    >
                      {saving && <Loader2 size={14} className="animate-spin" />}
                      {saving ? 'Envoi…' : 'Confirmer la commande'}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile floating cart FAB ── */}
      {count > 0 && !cartOpen && !checkout && (
        <motion.button
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          exit={{ y: 80 }}
          onClick={() => setCartOpen(true)}
          className="sm:hidden fixed bottom-24 left-4 right-4 z-40 bg-stone-900 text-white py-4 rounded-2xl font-black flex items-center justify-between px-5 shadow-2xl shadow-stone-900/40"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} />
            <span className="text-sm">{count} article{count > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-400">{total.toLocaleString('fr-FR')} FCFA</span>
            <ArrowRight size={16} />
          </div>
        </motion.button>
      )}
    </div>
  )
}
