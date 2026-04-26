import { useEffect, useState } from 'react'
import { getInvoices, getMyInvoices, recordPayment, cancelInvoice } from '../api/billing'
import { useAuth } from '../contexts/AuthContext'
import type { Invoice, RecordPaymentRequest } from '../types'
import { CreditCard, XCircle, X, Loader2, Eye } from 'lucide-react'
import RefreshButton from '../components/RefreshButton'

const statusColors: Record<string, string> = {
  UNPAID:    'bg-yellow-100 text-yellow-800',
  PAID:      'bg-green-100 text-green-800',
  PARTIAL:   'bg-blue-100 text-blue-800',
  OVERDUE:   'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
}
const statusLabels: Record<string, string> = {
  UNPAID: 'Non payée', PAID: 'Payée', PARTIAL: 'Partielle', OVERDUE: 'En retard', CANCELLED: 'Annulée',
}
const payMethods = ['CASH', 'BANK_TRANSFER', 'CHECK', 'MOBILE_MONEY'] as const
const payLabels: Record<string, string> = { CASH: 'Espèces', BANK_TRANSFER: 'Virement', CHECK: 'Chèque', MOBILE_MONEY: 'Mobile Money' }

export default function BillingPage() {
  const { isUser, isAdmin, isOperator } = useAuth()
  const canManage = isAdmin() || isOperator()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<Invoice | null>(null)
  const [payModal, setPayModal] = useState<Invoice | null>(null)
  const [payForm, setPayForm] = useState<RecordPaymentRequest>({ amountPaid: 0, paymentMethod: 'CASH', notes: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    // ROLE_USER voit uniquement ses factures
    const fetcher = isUser() ? getMyInvoices : getInvoices
    fetcher().then(data => setInvoices(Array.isArray(data) ? data : [])).catch(() => setInvoices([])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePay = async () => {
    if (!payModal) return
    setSaving(true)
    try { await recordPayment(payModal.id, payForm); setPayModal(null); load() }
    finally { setSaving(false) }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Annuler cette facture ?')) return
    await cancelInvoice(id); load()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isUser() ? 'Mes factures' : 'Facturation'}</h1>
          <p className="text-sm text-gray-500 mt-1">{invoices.length} facture(s)</p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : invoices.length === 0 ? (
          <p className="text-center text-gray-400 py-16">Aucune facture</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>{['N° Facture', 'Commande', canManage ? 'Client' : null, 'Montant total', 'Statut', 'Date', 'Actions']
                  .filter(Boolean).map(h => (
                    <th key={h!} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.orderNumber}</td>
                    {canManage && <td className="px-4 py-3">{inv.clientEmail ?? `Client #${inv.clientId}`}</td>}
                    <td className="px-4 py-3 font-semibold">{inv.totalAmount.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                        {statusLabels[inv.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setDetail(inv)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Détails"><Eye size={15} /></button>
                        {canManage && ['UNPAID', 'PARTIAL', 'OVERDUE'].includes(inv.status) && (
                          <button onClick={() => { setPayModal(inv); setPayForm({ amountPaid: inv.totalAmount, paymentMethod: 'CASH', notes: '' }) }}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Enregistrer paiement">
                            <CreditCard size={15} />
                          </button>
                        )}
                        {canManage && inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                          <button onClick={() => handleCancel(inv.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Annuler">
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

      {/* Modal Payer */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold">Enregistrer un paiement</h3>
              <button onClick={() => setPayModal(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                <input type="number" value={payForm.amountPaid} onChange={e => setPayForm({ ...payForm, amountPaid: +e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                <select value={payForm.paymentMethod} onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value as typeof payForm.paymentMethod })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {payMethods.map(m => <option key={m} value={m}>{payLabels[m]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input type="text" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setPayModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Annuler</button>
              <button onClick={handlePay} disabled={saving} className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-60">
                {saving && <Loader2 size={14} className="animate-spin" />} Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détail facture */}
      {detail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="font-semibold">{detail.invoiceNumber}</h3>
              <button onClick={() => setDetail(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              {[
                ['Commande', detail.orderNumber],
                canManage ? ['Client', detail.clientEmail ?? `#${detail.clientId}`] : null,
                ['Montant total', `${detail.totalAmount.toLocaleString('fr-FR')} FCFA`],
                ['Montant HT', `${(detail.netAmount ?? 0).toLocaleString('fr-FR')} FCFA`],
                ['TVA', `${(detail.taxAmount ?? 0).toLocaleString('fr-FR')} FCFA`],
                ['Statut', statusLabels[detail.status]],
                ['Mode de paiement', detail.paymentMethod ? payLabels[detail.paymentMethod] : '—'],
                ['Créée le', new Date(detail.createdAt).toLocaleDateString('fr-FR')],
                ['Échéance', detail.dueDate ? new Date(detail.dueDate).toLocaleDateString('fr-FR') : '—'],
                ['Payée le', detail.paidAt ? new Date(detail.paidAt).toLocaleDateString('fr-FR') : '—'],
              ].filter(Boolean).map((row) => { const [label, value] = row as [string, string]; return (
                <div key={label} className="flex justify-between border-b border-gray-50 pb-2">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-800">{value}</span>
                </div>
              )})}
              {detail.notes && <p className="text-gray-500 text-xs mt-2">{detail.notes}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
