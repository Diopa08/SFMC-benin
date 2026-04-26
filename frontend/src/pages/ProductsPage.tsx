import { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products'
import type { Product, ProductRequest } from '../types'
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'
import RefreshButton from '../components/RefreshButton'

const empty: ProductRequest = { name: '', description: '', category: '', unitPrice: 0, unit: '' }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductRequest>(empty)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const load = () => {
    setLoading(true)
    getProducts().then(setProducts).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({ name: p.name, description: p.description, category: p.category, unitPrice: p.unitPrice, unit: p.unit })
    setShowModal(true)
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      if (editing) await updateProduct(editing.id, form)
      else await createProduct(form)
      setShowModal(false)
      load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de la sauvegarde.')
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      await deleteProduct(id)
      load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      alert(err?.response?.data?.message || err?.message || 'Erreur lors de la suppression.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produits</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} produit(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={load} loading={loading} />
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            <Plus size={16} /> Nouveau produit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-400 py-16">Aucun produit</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {['Nom','Catégorie','Prix unitaire','Unité','Description','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                    <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{p.category}</span></td>
                    <td className="px-4 py-3 font-semibold">{p.unitPrice.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{p.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold text-gray-900">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h3>
              <button onClick={() => setShowModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Nom', key: 'name', type: 'text' },
                { label: 'Catégorie', key: 'category', type: 'text' },
                { label: 'Prix unitaire (FCFA)', key: 'unitPrice', type: 'number' },
                { label: 'Unité', key: 'unit', type: 'text' },
                { label: 'Description', key: 'description', type: 'text' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof ProductRequest]}
                    onChange={e => setForm({ ...form, [key]: type === 'number' ? +e.target.value : e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            {error && (
              <div className="mx-6 mb-2 bg-red-50 border border-red-100 text-red-600 rounded-lg px-4 py-2 text-sm">{error}</div>
            )}
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => { setShowModal(false); setError('') }} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
