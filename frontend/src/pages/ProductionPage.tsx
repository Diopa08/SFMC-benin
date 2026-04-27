import { useEffect, useState } from 'react'
import {
  getProductionOrders, createProductionOrder, startProduction,
  qualityCheck, completeProduction, cancelProduction,
  type ProductionOrder, type ProductionStatus
} from '../api/production'
import { getProducts } from '../api/products'
import type { Product } from '../types'
import { Factory, Plus, X, Loader2, Play, CheckCircle, FlaskConical, XCircle } from 'lucide-react'
import RefreshButton from '../components/RefreshButton'

const STATUS_LABEL: Record<ProductionStatus, string> = {
  PLANNED:       'Planifié',
  IN_PROGRESS:   'En cours',
  QUALITY_CHECK: 'Contrôle qualité',
  COMPLETED:     'Terminé',
  CANCELLED:     'Annulé',
}

const STATUS_COLOR: Record<ProductionStatus, string> = {
  PLANNED:       'bg-blue-100 text-blue-700',
  IN_PROGRESS:   'bg-yellow-100 text-yellow-700',
  QUALITY_CHECK: 'bg-purple-100 text-purple-700',
  COMPLETED:     'bg-green-100 text-green-700',
  CANCELLED:     'bg-red-100 text-red-700',
}

const PRIORITY_COLOR: Record<string, string> = {
  LOW:    'bg-gray-100 text-gray-600',
  NORMAL: 'bg-blue-50 text-blue-600',
  HIGH:   'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
}

export default function ProductionPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [form, setForm] = useState({
    productId: '', productName: '', quantityRequired: '',
    priority: 'NORMAL', notes: '', plannedStartDate: ''
  })

  const load = async () => {
    setLoading(true); setError('')
    try { setOrders(await getProductionOrders()) }
    catch { setError('Impossible de charger les ordres de production.') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openForm = async () => {
    setShowForm(true)
    setLoadingProducts(true)
    try { setProducts(await getProducts()) }
    catch { /* silently keep empty list */ }
    finally { setLoadingProducts(false) }
  }

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = products.find(p => p.id === Number(e.target.value))
    if (selected) {
      setForm(f => ({ ...f, productId: String(selected.id), productName: selected.name }))
    } else {
      setForm(f => ({ ...f, productId: '', productName: '' }))
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await createProductionOrder({
        productId: Number(form.productId),
        productName: form.productName,
        quantityRequired: Number(form.quantityRequired),
        priority: form.priority,
      })
      setShowForm(false)
      setProducts([])
      setForm({ productId: '', productName: '', quantityRequired: '', priority: 'NORMAL', notes: '', plannedStartDate: '' })
      await load()
    } catch { setError("Erreur lors de la création de l'ordre.") }
    finally { setSaving(false) }
  }

  const action = async (fn: () => Promise<ProductionOrder>) => {
    try { await fn(); await load() }
    catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      setError(msg)
    }
  }

  const stats = {
    planned:     orders.filter(o => o.status === 'PLANNED').length,
    inProgress:  orders.filter(o => o.status === 'IN_PROGRESS').length,
    quality:     orders.filter(o => o.status === 'QUALITY_CHECK').length,
    completed:   orders.filter(o => o.status === 'COMPLETED').length,
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Factory size={24} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Production</h1>
            <p className="text-sm text-gray-500">{orders.length} ordre(s) au total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={load} loading={loading} />
          <button onClick={openForm}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> Nouvel ordre
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Planifiés',       value: stats.planned,    color: 'blue' },
          { label: 'En cours',        value: stats.inProgress, color: 'yellow' },
          { label: 'Contrôle qualité',value: stats.quality,    color: 'purple' },
          { label: 'Terminés',        value: stats.completed,  color: 'green' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{error}</div>}

      {/* Modal création */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Nouvel ordre de production</h2>
              <button type="button" onClick={() => { setShowForm(false); setProducts([]) }}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Produit</label>
                {loadingProducts ? (
                  <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                    <Loader2 size={14} className="animate-spin" /> Chargement des produits…
                  </div>
                ) : (
                  <select required value={form.productId} onChange={handleProductSelect}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                    <option value="">— Sélectionner un produit —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.unit ? `(${p.unit})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <input type="number" required min="1" value={form.quantityRequired}
                    onChange={e => setForm({...form, quantityRequired: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="LOW">Faible</option>
                    <option value="NORMAL">Normale</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date de début prévue</label>
                <input type="datetime-local" value={form.plannedStartDate}
                  onChange={e => setForm({...form, plannedStartDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  placeholder="Instructions particulières..." />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setProducts([]) }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
                  Annuler
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Création...</> : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-orange-500" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Référence</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Produit</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Quantité</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Priorité</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Statut</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <Factory size={32} className="mx-auto mb-2 opacity-40" />
                  Aucun ordre de production
                </td></tr>
              ) : orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{o.referenceNumber}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{o.productName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {o.quantityProduced > 0
                      ? <span>{o.quantityProduced} / {o.quantityRequired}</span>
                      : <span>{o.quantityRequired}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_COLOR[o.priority] || ''}`}>
                      {o.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLOR[o.status]}`}>
                      {STATUS_LABEL[o.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {o.status === 'PLANNED' && (
                        <button onClick={() => action(() => startProduction(o.id))}
                          title="Démarrer"
                          className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition">
                          <Play size={14} />
                        </button>
                      )}
                      {o.status === 'IN_PROGRESS' && (
                        <button onClick={() => action(() => qualityCheck(o.id))}
                          title="Contrôle qualité"
                          className="p-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition">
                          <FlaskConical size={14} />
                        </button>
                      )}
                      {(o.status === 'IN_PROGRESS' || o.status === 'QUALITY_CHECK') && (
                        <button onClick={() => {
                          const qty = prompt('Quantité produite ?', String(o.quantityRequired))
                          if (qty !== null) action(() => completeProduction(o.id, Number(qty)))
                        }}
                          title="Terminer"
                          className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {(o.status === 'PLANNED' || o.status === 'IN_PROGRESS') && (
                        <button onClick={() => {
                          const reason = prompt('Raison de l\'annulation ?')
                          if (reason !== null) action(() => cancelProduction(o.id))
                        }}
                          title="Annuler"
                          className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition">
                          <XCircle size={14} />
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
  )
}
