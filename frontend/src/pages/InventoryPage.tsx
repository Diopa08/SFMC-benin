import { useEffect, useState } from 'react'
import { getStocks, createStock, updateStock, getMovements } from '../api/inventory'
import { getProducts } from '../api/products'
import type { Stock, StockMovement } from '../types'
import type { Product } from '../types'
import { Plus, RefreshCw, History, X, Loader2, AlertTriangle, Warehouse, TrendingUp, TrendingDown } from 'lucide-react'
import RefreshButton from '../components/RefreshButton'

// Entrepôts fixes (SFMC Bénin)
const WAREHOUSES = [
  { id: 1, name: 'Entrepôt Principal — Cotonou' },
  { id: 2, name: 'Entrepôt Secondaire — Porto-Novo' },
  { id: 3, name: 'Entrepôt Parakou' },
  { id: 4, name: 'Dépôt Abomey-Calavi' },
]

const warehouseName = (id: number) =>
  WAREHOUSES.find(w => w.id === id)?.name ?? `Entrepôt #${id}`

export default function InventoryPage() {
  const [stocks, setStocks]       = useState<Stock[]>([])
  const [products, setProducts]   = useState<Product[]>([])
  const [loading, setLoading]     = useState(true)
  const [showAdd, setShowAdd]     = useState(false)
  const [showUpdate, setShowUpdate]   = useState<Stock | null>(null)
  const [showMovements, setShowMovements] = useState<{ stock: Stock; movements: StockMovement[] } | null>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')

  // Formulaire ajout
  const [selProductId, setSelProductId]   = useState('')
  const [selWarehouseId, setSelWarehouseId] = useState('1')
  const [quantity, setQuantity]           = useState(0)
  const [threshold, setThreshold]         = useState(10)

  // Formulaire mouvement
  const [moveType, setMoveType]   = useState<'IN' | 'OUT'>('IN')
  const [moveQty, setMoveQty]     = useState(0)
  const [moveReason, setMoveReason] = useState('')

  const load = async () => {
    setLoading(true)
    try { setStocks(await getStocks()) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    getProducts().then(setProducts).catch(() => {})
  }, [])

  const productById = (id: number) => products.find(p => p.id === id)

  const handleAdd = async () => {
    if (!selProductId) { setError('Sélectionnez un produit.'); return }
    setError('')
    setSaving(true)
    try {
      await createStock({
        productId:   Number(selProductId),
        warehouseId: Number(selWarehouseId),
        quantity,
        threshold,
      })
      setShowAdd(false)
      setSelProductId('')
      setSelWarehouseId('1')
      setQuantity(0)
      setThreshold(10)
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Erreur lors de la création.')
    } finally { setSaving(false) }
  }

  const handleUpdate = async () => {
    if (!showUpdate) return
    if (moveQty <= 0) { setError('La quantité doit être supérieure à 0.'); return }
    setError('')
    setSaving(true)
    try {
      await updateStock(showUpdate.productId, { quantity: moveQty, reason: moveReason, type: moveType })
      setShowUpdate(null)
      setMoveQty(0); setMoveReason(''); setMoveType('IN')
      load()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Erreur lors du mouvement.')
    } finally { setSaving(false) }
  }

  const handleMovements = async (stock: Stock) => {
    const movements = await getMovements(stock.productId)
    setShowMovements({ stock, movements })
  }

  const lowCount   = stocks.filter(s => s.quantity <= s.threshold).length
  const totalItems = stocks.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventaire</h1>
          <p className="text-sm text-gray-500 mt-1">{totalItems} ligne(s) de stock</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={load} loading={loading} />
          <button onClick={() => { setShowAdd(true); setError('') }}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> Ajouter un stock
          </button>
        </div>
      </div>

      {/* KPIs */}
      {lowCount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
          <AlertTriangle size={20} className="text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800 font-medium">
            {lowCount} produit(s) en dessous du seuil d'alerte — réapprovisionnement recommandé
          </p>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-teal-600" size={32} />
          </div>
        ) : stocks.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Warehouse size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucun stock enregistré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  {['Produit', 'Catégorie', 'Entrepôt', 'Quantité', 'Seuil', 'État', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stocks.map(s => {
                  const prod = productById(s.productId)
                  const low  = s.quantity <= s.threshold
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50 transition ${low ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {prod ? prod.name : `Produit #${s.productId}`}
                        </div>
                        {prod && <div className="text-xs text-gray-400">{prod.unit}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {prod?.category ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {warehouseName(s.warehouseId)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold text-base ${low ? 'text-red-600' : 'text-gray-900'}`}>
                          {s.quantity}
                        </span>
                        {prod && <span className="text-xs text-gray-400 ml-1">{prod.unit}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">{s.threshold}</td>
                      <td className="px-4 py-3">
                        {low
                          ? <span className="flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full w-fit">
                              <AlertTriangle size={11} /> Stock bas
                            </span>
                          : <span className="flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full w-fit">
                              ✓ Normal
                            </span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setShowUpdate(s); setMoveType('IN'); setMoveQty(0); setMoveReason(''); setError('') }}
                            className="p-1.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded transition"
                            title="Enregistrer un mouvement">
                            <RefreshCw size={15} />
                          </button>
                          <button
                            onClick={() => handleMovements(s)}
                            className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition"
                            title="Historique des mouvements">
                            <History size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal : Ajouter un stock ── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Nouveau stock</h3>
              <button onClick={() => setShowAdd(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* Produit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produit <span className="text-red-500">*</span>
                </label>
                <select value={selProductId} onChange={e => setSelProductId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">-- Sélectionner un produit --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category}) — {p.unit}
                    </option>
                  ))}
                </select>
              </div>

              {/* Entrepôt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entrepôt</label>
                <select value={selWarehouseId} onChange={e => setSelWarehouseId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  {WAREHOUSES.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              {/* Quantité + Seuil */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité initiale</label>
                  <input type="number" min={0} value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seuil d'alerte</label>
                  <input type="number" min={0} value={threshold}
                    onChange={e => setThreshold(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  <p className="text-xs text-gray-400 mt-1">Alerte si quantité ≤ seuil</p>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                Annuler
              </button>
              <button onClick={handleAdd} disabled={saving}
                className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-60 flex items-center gap-2 transition">
                {saving && <Loader2 size={14} className="animate-spin" />} Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : Mouvement de stock ── */}
      {showUpdate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Mouvement de stock</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {productById(showUpdate.productId)?.name ?? `Produit #${showUpdate.productId}`}
                  {' — '}{warehouseName(showUpdate.warehouseId)}
                </p>
              </div>
              <button onClick={() => setShowUpdate(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">

              {/* Stock actuel */}
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex justify-between text-sm">
                <span className="text-gray-500">Stock actuel :</span>
                <span className="font-bold text-gray-900">
                  {showUpdate.quantity} {productById(showUpdate.productId)?.unit ?? 'unités'}
                </span>
              </div>

              {/* Type : Entrée / Sortie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de mouvement</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMoveType('IN')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                      moveType === 'IN'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    <TrendingUp size={16} /> Entrée (IN)
                  </button>
                  <button onClick={() => setMoveType('OUT')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition ${
                      moveType === 'OUT'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}>
                    <TrendingDown size={16} /> Sortie (OUT)
                  </button>
                </div>
              </div>

              {/* Quantité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input type="number" min={1} value={moveQty || ''}
                  onChange={e => setMoveQty(Number(e.target.value))}
                  placeholder="Ex: 50"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                {moveType === 'OUT' && moveQty > showUpdate.quantity && (
                  <p className="text-xs text-red-500 mt-1">
                    Quantité insuffisante (stock : {showUpdate.quantity})
                  </p>
                )}
              </div>

              {/* Motif */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motif {moveType === 'OUT' ? '(sortie)' : '(entrée)'}
                </label>
                <select value={moveReason} onChange={e => setMoveReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">-- Choisir un motif --</option>
                  {moveType === 'IN' ? (
                    <>
                      <option value="Production terminée">Production terminée</option>
                      <option value="Réapprovisionnement fournisseur">Réapprovisionnement fournisseur</option>
                      <option value="Retour client">Retour client</option>
                      <option value="Correction d'inventaire">Correction d'inventaire</option>
                    </>
                  ) : (
                    <>
                      <option value="Vente / commande client">Vente / commande client</option>
                      <option value="Transfert vers autre entrepôt">Transfert vers autre entrepôt</option>
                      <option value="Perte / casse">Perte / casse</option>
                      <option value="Correction d'inventaire">Correction d'inventaire</option>
                    </>
                  )}
                </select>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowUpdate(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition">
                Annuler
              </button>
              <button onClick={handleUpdate}
                disabled={saving || moveQty <= 0 || (moveType === 'OUT' && moveQty > showUpdate.quantity)}
                className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60 flex items-center gap-2 transition font-medium ${
                  moveType === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {saving && <Loader2 size={14} className="animate-spin" />}
                {moveType === 'IN' ? 'Enregistrer entrée' : 'Enregistrer sortie'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : Historique des mouvements ── */}
      {showMovements && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="font-semibold text-gray-900">Historique des mouvements</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {productById(showMovements.stock.productId)?.name ?? `Produit #${showMovements.stock.productId}`}
                  {' — '}{warehouseName(showMovements.stock.warehouseId)}
                </p>
              </div>
              <button onClick={() => setShowMovements(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
              {showMovements.movements.length === 0 ? (
                <p className="text-center text-gray-400 py-8">Aucun mouvement enregistré</p>
              ) : (
                <div className="space-y-2">
                  {showMovements.movements.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                      <div className={`p-1.5 rounded-full ${m.type === 'IN' ? 'bg-green-100' : 'bg-red-100'}`}>
                        {m.type === 'IN'
                          ? <TrendingUp size={14} className="text-green-600" />
                          : <TrendingDown size={14} className="text-red-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{m.reason || '—'}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(m.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                        {m.type === 'IN' ? '+' : '-'}{m.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
