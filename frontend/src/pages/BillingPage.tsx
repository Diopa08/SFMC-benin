import { useEffect, useState } from 'react'
import {
  getInvoices, getMyInvoices, recordPayment,
  cancelInvoice, declarePayment, confirmPayment, verifyFedapayPayment
} from '../api/billing'
import { useAuth } from '../contexts/AuthContext'
import type { Invoice, RecordPaymentRequest, DeclarePaymentRequest, PaymentMethod } from '../types'
import {
  CreditCard, XCircle, X, Loader2, Eye, FileText,
  CheckCircle, Clock, AlertTriangle, ChevronRight, Zap,
  Smartphone, Banknote, Building, Send, ShieldCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import RefreshButton from '../components/RefreshButton'

// ─── Config statuts ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  UNPAID:          'bg-amber-100 text-amber-800 border-amber-200',
  PAID:            'bg-emerald-100 text-emerald-800 border-emerald-200',
  PARTIAL:         'bg-blue-100 text-blue-800 border-blue-200',
  PENDING_PAYMENT: 'bg-violet-100 text-violet-800 border-violet-200',
  OVERDUE:         'bg-red-100 text-red-800 border-red-200',
  CANCELLED:       'bg-stone-100 text-stone-500 border-stone-200',
}
const STATUS_LABELS: Record<string, string> = {
  UNPAID:          'Non payée',
  PAID:            'Payée',
  PARTIAL:         'Partielle',
  PENDING_PAYMENT: 'En vérification',
  OVERDUE:         'En retard',
  CANCELLED:       'Annulée',
}
const STATUS_ICONS: Record<string, React.ReactNode> = {
  UNPAID:          <Clock size={12} />,
  PAID:            <CheckCircle size={12} />,
  PARTIAL:         <Zap size={12} />,
  PENDING_PAYMENT: <ShieldCheck size={12} />,
  OVERDUE:         <AlertTriangle size={12} />,
  CANCELLED:       <XCircle size={12} />,
}

// ─── FedaPay ───────────────────────────────────────────────────────────────────
const FEDAPAY_PUBLIC_KEY = 'pk_sandbox_TKFvKhnpjyYKu8c5bWP7weA7'

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    FedaPay: any
  }
}

const PAY_METHODS  = ['CASH', 'BANK_TRANSFER', 'CHECK', 'MOBILE_MONEY'] as const
const PAY_LABELS: Record<string, string> = {
  CASH: 'Espèces', BANK_TRANSFER: 'Virement bancaire',
  CHECK: 'Chèque', MOBILE_MONEY: 'Mobile Money',
}
const PAY_ICONS: Record<string, string> = {
  CASH: '💵', BANK_TRANSFER: '🏦', CHECK: '📄', MOBILE_MONEY: '📱',
}

// ─── Instructions de paiement par méthode ─────────────────────────────────────
const PAY_INSTRUCTIONS: Record<string, { icon: React.ReactNode; title: string; lines: string[] }> = {
  MOBILE_MONEY: {
    icon: <Smartphone size={16} className="text-violet-500" />,
    title: 'Paiement Mobile Money',
    lines: [
      'MTN MoMo → composez *880# puis suivez les instructions',
      'Moov Money → composez *555# puis suivez les instructions',
      'Sélectionnez "Payer un marchand" et entrez le code SFMC',
      'Conservez votre ID de transaction pour la référence ci-dessous',
    ],
  },
  CASH: {
    icon: <Banknote size={16} className="text-green-500" />,
    title: 'Paiement en espèces',
    lines: [
      'Présentez-vous au bureau SFMC Bénin, Avenue Steinmetz, Cotonou',
      'Horaires : Lun–Ven 8h–17h · Sam 8h–12h',
      'Munissez-vous de cette facture et d\'une pièce d\'identité',
      "Le reçu de caisse vous sera remis sur place",
    ],
  },
  BANK_TRANSFER: {
    icon: <Building size={16} className="text-blue-500" />,
    title: 'Virement bancaire',
    lines: [
      'Banque : Bank of Africa Bénin',
      'IBAN : BJ66 BJ04 0610 1000 0000 1234 567',
      'Intitulé : SFMC Bénin SARL',
      'Référence virement : votre numéro de facture',
    ],
  },
  CHECK: {
    icon: <FileText size={16} className="text-orange-500" />,
    title: 'Paiement par chèque',
    lines: [
      'Chèque à l\'ordre de : SFMC Bénin SARL',
      'À déposer au bureau ou envoyer par courrier recommandé',
      'Notez votre numéro de facture au dos du chèque',
    ],
  },
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function DueDateBadge({ dueDate, status }: { dueDate?: string | null; status: string }) {
  if (status === 'PAID' || status === 'CANCELLED' || status === 'PENDING_PAYMENT') return null
  const days = daysUntil(dueDate)
  if (days === null) return null
  if (days < 0) return (
    <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
      <AlertTriangle size={10} /> En retard de {Math.abs(days)}j
    </span>
  )
  if (days === 0) return (
    <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-100">
      <Clock size={10} /> Échéance aujourd'hui
    </span>
  )
  if (days <= 7) return (
    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
      <Clock size={10} /> Dans {days} jour{days > 1 ? 's' : ''}
    </span>
  )
  return (
    <span className="text-xs text-stone-400 font-medium">
      Échéance le {new Date(dueDate!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
    </span>
  )
}

// ─── Modal de paiement client ──────────────────────────────────────────────────
function DeclarePaymentModal({
  invoice,
  onClose,
  onSuccess,
}: {
  invoice: Invoice
  onClose: () => void
  onSuccess: () => void
}) {
  const [method, setMethod]       = useState<PaymentMethod>('MOBILE_MONEY')
  const [reference, setReference] = useState('')
  const [amount]                  = useState(invoice.totalAmount)
  const [notes, setNotes]         = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const [doneType, setDoneType]   = useState<'fedapay' | 'declare'>('declare')

  const instructions = PAY_INSTRUCTIONS[method]
  const needsRef     = method === 'BANK_TRANSFER'
  const isMoMo       = method === 'MOBILE_MONEY'

  // ── Paiement FedaPay (Mobile Money direct) ─────────────────────────────────
  const handleFedapayPayment = () => {
    setError('')
    if (!window.FedaPay) {
      setError('Le module de paiement FedaPay n\'est pas chargé. Vérifiez votre connexion.')
      return
    }
    setSaving(true)
    try {
      window.FedaPay.init({
        public_key: FEDAPAY_PUBLIC_KEY,
        transaction: {
          amount: Math.round(amount),
          description: `Facture ${invoice.invoiceNumber} | id:${invoice.id}`,
        },
        customer: {
          email: invoice.clientEmail ?? '',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onComplete: async (response: any) => {
          // FedaPay retourne { reason: "CHECKOUT COMPLETE", transaction: { id, status, ... } }
          // La transaction réelle est dans response.transaction, pas à la racine
          const txn    = response?.transaction ?? response
          const reason = response?.reason ?? ''

          // Dialogue fermé sans paiement
          if (reason === 'DIALOG DISMISSED' || !txn?.id) {
            setSaving(false)
            return
          }

          // ✅ Le statut est dans txn.status (string "approved")
          if (txn.status === 'approved') {
            try {
              await verifyFedapayPayment(invoice.id, String(txn.id))
              setDoneType('fedapay')
              setDone(true)
              setTimeout(() => { onSuccess(); onClose() }, 2800)
            } catch {
              setError('Paiement reçu par FedaPay mais la vérification a échoué. Contactez le support avec l\'ID : ' + txn.id)
              setSaving(false)
            }
          } else {
            setError(`Paiement non abouti (statut : ${txn.status ?? 'inconnu'}). Vérifiez votre solde et réessayez.`)
            setSaving(false)
          }
        },
      }).open()
    } catch (e: unknown) {
      const err = e as { message?: string }
      setError(err?.message ?? 'Impossible d\'ouvrir le widget de paiement.')
      setSaving(false)
    }
  }

  // ── Déclaration manuelle (Espèces / Virement / Chèque) ─────────────────────
  const handleManualDeclare = async () => {
    if (needsRef && !reference.trim()) {
      setError('La référence de virement est obligatoire.')
      return
    }
    setError(''); setSaving(true)
    try {
      const body: DeclarePaymentRequest = {
        amountDeclared: amount,
        paymentMethod:  method,
        reference:      reference.trim() || undefined,
        notes:          notes.trim() || undefined,
      }
      await declarePayment(invoice.id, body)
      setDoneType('declare')
      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 2500)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      setError(err?.response?.data?.message || err?.message || 'Erreur lors de la déclaration.')
    } finally { setSaving(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 bg-stone-50">
          <div>
            <h3 className="font-black text-stone-900 text-lg">Régler ma facture</h3>
            <p className="text-xs text-stone-400 mt-0.5 font-mono">{invoice.invoiceNumber}</p>
          </div>
          <button onClick={onClose} disabled={saving}
            className="p-2 rounded-xl hover:bg-stone-200 text-stone-400 transition-colors disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        {/* ── Success state ─────────────────────────────────────────────────── */}
        {done ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center"
          >
            {doneType === 'fedapay' ? (
              <>
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <CheckCircle size={36} className="text-emerald-500" />
                </div>
                <h4 className="text-xl font-black text-stone-900 mb-2">Paiement confirmé !</h4>
                <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto">
                  Votre paiement a été vérifié et validé automatiquement par FedaPay. Votre facture est maintenant réglée.
                </p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <ShieldCheck size={36} className="text-violet-500" />
                </div>
                <h4 className="text-xl font-black text-stone-900 mb-2">Déclaration envoyée !</h4>
                <p className="text-stone-400 text-sm leading-relaxed max-w-xs mx-auto">
                  Notre équipe vérifiera votre paiement et confirmera sous 24h.
                </p>
              </>
            )}
          </motion.div>
        ) : (
          <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">

            {/* Amount reminder */}
            <div className="text-center py-3 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Montant à régler</p>
              <p className="text-3xl font-black text-stone-900">{invoice.totalAmount.toLocaleString('fr-FR')}</p>
              <p className="text-sm text-stone-400 font-bold">FCFA TTC</p>
            </div>

            {/* Method selector */}
            <div>
              <p className="text-sm font-bold text-stone-700 mb-3">Comment souhaitez-vous payer ?</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { key: 'MOBILE_MONEY', label: 'Mobile Money', icon: <Smartphone size={18} /> },
                  { key: 'CASH',         label: 'Espèces',      icon: <Banknote size={18} />   },
                  { key: 'BANK_TRANSFER',label: 'Virement',     icon: <Building size={18} />   },
                  { key: 'CHECK',        label: 'Chèque',       icon: <FileText size={18} />   },
                ] as const).map(opt => (
                  <button key={opt.key} onClick={() => { setMethod(opt.key as PaymentMethod); setError('') }}
                    className={`flex items-center gap-2.5 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all duration-150 ${
                      method === opt.key
                        ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <span className={method === opt.key ? 'text-amber-400' : ''}>{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Mobile Money : FedaPay direct ────────────────────────────── */}
            {isMoMo ? (
              <div className="space-y-4">
                {/* FedaPay info banner */}
                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Smartphone size={15} className="text-indigo-500" />
                    <p className="text-sm font-black text-indigo-800">Paiement Mobile Money sécurisé</p>
                    <span className="ml-auto text-[10px] font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">via FedaPay</span>
                  </div>
                  <ul className="space-y-1">
                    {[
                      'Cliquez "Payer maintenant" ci-dessous',
                      'Choisissez MTN MoMo ou Moov Money',
                      'Entrez votre numéro et confirmez avec votre PIN',
                      'La confirmation est instantanée et automatique',
                    ].map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-indigo-600">
                        <span className="font-black mt-0.5 shrink-0 text-indigo-400">{i + 1}.</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                    <X size={14} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={onClose} disabled={saving}
                    className="flex-1 py-3.5 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-40">
                    Annuler
                  </button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleFedapayPayment} disabled={saving}
                    className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm shadow-lg shadow-indigo-500/25"
                  >
                    {saving
                      ? <><Loader2 size={14} className="animate-spin" /> Traitement…</>
                      : <><Smartphone size={14} /> Payer maintenant</>
                    }
                  </motion.button>
                </div>
              </div>
            ) : (
              /* ── Autres méthodes : déclaration manuelle ─────────────────── */
              <div className="space-y-4">
                {/* Instructions */}
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {instructions.icon}
                    <p className="text-sm font-bold text-stone-700">{instructions.title}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {instructions.lines.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-stone-500 leading-relaxed">
                        <span className="text-amber-500 font-black mt-0.5 shrink-0">{i + 1}.</span>
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Reference for bank transfer */}
                {needsRef && (
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">
                      Référence de virement <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text" value={reference} onChange={e => setReference(e.target.value)}
                      placeholder="Ex : VIR-20260428-001"
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5">
                    Notes <span className="text-stone-400 font-normal">(optionnel)</span>
                  </label>
                  <input
                    type="text" value={notes} onChange={e => setNotes(e.target.value)}
                    placeholder="Informations complémentaires pour l'équipe…"
                    className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                    <X size={14} className="shrink-0 mt-0.5" />{error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={onClose}
                    className="flex-1 py-3 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors">
                    Annuler
                  </button>
                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleManualDeclare} disabled={saving}
                    className="flex-1 py-3 bg-stone-900 hover:bg-amber-500 hover:text-stone-900 disabled:opacity-60 text-white font-black rounded-xl flex items-center justify-center gap-2 transition-all duration-200 text-sm shadow-lg"
                  >
                    {saving
                      ? <><Loader2 size={14} className="animate-spin" /> Envoi…</>
                      : <><Send size={14} /> Déclarer mon paiement</>
                    }
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function BillingPage() {
  const { isUser, isAdmin, isOperator } = useAuth()
  const canManage = isAdmin() || isOperator()

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading]   = useState(true)
  const [detail, setDetail]     = useState<Invoice | null>(null)
  const [payModal, setPayModal] = useState<Invoice | null>(null)          // modal admin
  const [declareModal, setDeclareModal] = useState<Invoice | null>(null)  // modal client
  const [payForm, setPayForm]   = useState<RecordPaymentRequest>({ amountPaid: 0, paymentMethod: 'CASH', notes: '' })
  const [saving, setSaving]     = useState(false)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    const fetcher = isUser() ? getMyInvoices : getInvoices
    fetcher()
      .then(data => setInvoices(Array.isArray(data) ? data : []))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdminPay = async () => {
    if (!payModal) return
    setSaving(true)
    try { await recordPayment(payModal.id, payForm); setPayModal(null); load() }
    finally { setSaving(false) }
  }

  const handleConfirmPayment = async (id: number) => {
    if (!confirm('Confirmer ce paiement déclaré par le client ?')) return
    setConfirmingId(id)
    try { await confirmPayment(id); load() }
    catch { alert('Erreur lors de la confirmation.') }
    finally { setConfirmingId(null) }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('Annuler cette facture ?')) return
    await cancelInvoice(id); load()
  }

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN / OPERATOR VIEW
  // ──────────────────────────────────────────────────────────────────────────
  if (canManage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Facturation</h1>
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
                  <tr>
                    {['N° Facture', 'N° Commande', 'Client', 'Montant TTC', 'Statut', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invoices.map(inv => (
                    <tr key={inv.id} className={`hover:bg-gray-50 ${inv.status === 'PENDING_PAYMENT' ? 'bg-violet-50/50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs font-medium text-blue-700">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">
                        {inv.orderNumber ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{inv.clientEmail ?? `Client #${inv.clientId}`}</td>
                      <td className="px-4 py-3 font-bold text-gray-900">{inv.totalAmount.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[inv.status]}`}>
                          {STATUS_ICONS[inv.status]}{STATUS_LABELS[inv.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 items-center">
                          <button onClick={() => setDetail(inv)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded" title="Détails">
                            <Eye size={15} />
                          </button>

                          {/* Bouton "Confirmer paiement déclaré" */}
                          {inv.status === 'PENDING_PAYMENT' && (
                            <button
                              onClick={() => handleConfirmPayment(inv.id)}
                              disabled={confirmingId === inv.id}
                              className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-violet-700 bg-violet-100 hover:bg-violet-200 rounded-lg transition-colors disabled:opacity-50"
                              title="Confirmer le paiement déclaré"
                            >
                              {confirmingId === inv.id
                                ? <Loader2 size={12} className="animate-spin" />
                                : <ShieldCheck size={12} />
                              }
                              Confirmer
                            </button>
                          )}

                          {/* Bouton paiement admin standard */}
                          {['UNPAID', 'PARTIAL', 'OVERDUE'].includes(inv.status) && (
                            <button
                              onClick={() => { setPayModal(inv); setPayForm({ amountPaid: inv.totalAmount, paymentMethod: 'CASH', notes: '' }) }}
                              className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded" title="Enregistrer paiement">
                              <CreditCard size={15} />
                            </button>
                          )}

                          {inv.status !== 'CANCELLED' && inv.status !== 'PAID' && (
                            <button onClick={() => handleCancel(inv.id)}
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

        {/* Bandeau d'info si des paiements sont en attente */}
        {invoices.some(i => i.status === 'PENDING_PAYMENT') && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl px-5 py-4 flex items-start gap-3">
            <ShieldCheck size={18} className="text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-violet-800">
                {invoices.filter(i => i.status === 'PENDING_PAYMENT').length} paiement(s) en attente de confirmation
              </p>
              <p className="text-xs text-violet-600 mt-0.5">
                Des clients ont déclaré leurs paiements. Vérifiez les références et confirmez dans la liste ci-dessus.
              </p>
            </div>
          </div>
        )}

        {/* Admin pay modal */}
        {payModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="font-semibold">Enregistrer un paiement</h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{payModal.invoiceNumber}</p>
                </div>
                <button onClick={() => setPayModal(null)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                  <input type="number" value={payForm.amountPaid}
                    onChange={e => setPayForm({ ...payForm, amountPaid: +e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mode de paiement</label>
                  <select value={payForm.paymentMethod}
                    onChange={e => setPayForm({ ...payForm, paymentMethod: e.target.value as typeof payForm.paymentMethod })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {PAY_METHODS.map(m => <option key={m} value={m}>{PAY_LABELS[m]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={payForm.notes}
                    onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button onClick={() => setPayModal(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Annuler</button>
                <button onClick={handleAdminPay} disabled={saving}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 size={14} className="animate-spin" />} Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin detail modal */}
        {detail && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h3 className="font-semibold font-mono">{detail.invoiceNumber}</h3>
                  <span className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[detail.status]}`}>
                    {STATUS_ICONS[detail.status]}{STATUS_LABELS[detail.status]}
                  </span>
                </div>
                <button onClick={() => setDetail(null)}><X size={20} className="text-gray-400" /></button>
              </div>
              <div className="p-6 space-y-3 text-sm">
                {[
                  ['Commande',       detail.orderNumber ?? '—'],
                  ['Client',         detail.clientEmail ?? `#${detail.clientId}`],
                  ['Montant TTC',    `${detail.totalAmount.toLocaleString('fr-FR')} FCFA`],
                  ['Montant HT',     `${(detail.netAmount ?? 0).toLocaleString('fr-FR')} FCFA`],
                  ['TVA (18%)',      `${(detail.taxAmount ?? 0).toLocaleString('fr-FR')} FCFA`],
                  ['Statut',         STATUS_LABELS[detail.status]],
                  ['Mode paiement',  detail.paymentMethod ? PAY_LABELS[detail.paymentMethod] : '—'],
                  ['Réf. paiement',  detail.paymentReference ?? '—'],
                  ['Créée le',       new Date(detail.createdAt).toLocaleDateString('fr-FR')],
                  ['Échéance',       detail.dueDate ? new Date(detail.dueDate).toLocaleDateString('fr-FR') : '—'],
                  ['Payée le',       detail.paidAt ? new Date(detail.paidAt).toLocaleDateString('fr-FR') : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between border-b border-gray-50 pb-2 gap-4">
                    <span className="text-gray-500 shrink-0">{label}</span>
                    <span className="font-medium text-gray-800 text-right break-all">{value}</span>
                  </div>
                ))}
                {detail.notes && (
                  <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 mt-2">
                    <p className="text-xs font-semibold text-violet-600 mb-0.5">Notes / Déclaration client</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{detail.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CLIENT VIEW
  // ──────────────────────────────────────────────────────────────────────────
  const unpaidTotal = invoices
    .filter(i => ['UNPAID', 'OVERDUE', 'PARTIAL', 'PENDING_PAYMENT'].includes(i.status))
    .reduce((s, i) => s + i.totalAmount, 0)
  const paidCount = invoices.filter(i => i.status === 'PAID').length
  const pendingCount = invoices.filter(i => i.status === 'PENDING_PAYMENT').length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Mes factures</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {loading ? '…' : `${invoices.length} facture${invoices.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <RefreshButton onClick={load} loading={loading} />
      </div>

      {/* KPIs */}
      {!loading && invoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Total à régler</p>
            <p className="text-2xl font-black text-amber-600">{unpaidTotal.toLocaleString('fr-FR')}</p>
            <p className="text-xs text-stone-400 font-semibold mt-0.5">FCFA</p>
          </div>
          <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Payées</p>
            <p className="text-2xl font-black text-emerald-600">{paidCount}</p>
            <p className="text-xs text-stone-400 font-semibold mt-0.5">sur {invoices.length}</p>
          </div>
          {pendingCount > 0 ? (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-xs font-bold text-violet-600 uppercase tracking-wide mb-1">En vérification</p>
              <p className="text-2xl font-black text-violet-700">{pendingCount}</p>
              <p className="text-xs text-violet-500 font-semibold mt-0.5">paiement(s) déclaré(s)</p>
            </div>
          ) : (
            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm col-span-2 sm:col-span-1">
              <p className="text-xs font-bold text-stone-400 uppercase tracking-wide mb-1">Non payées</p>
              <p className="text-2xl font-black text-stone-700">{invoices.filter(i => i.status === 'UNPAID').length}</p>
              <p className="text-xs text-stone-400 font-semibold mt-0.5">en attente</p>
            </div>
          )}
        </div>
      )}

      {/* Invoice cards */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-6 h-40 animate-pulse" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
          <div className="w-24 h-24 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <FileText size={40} className="text-stone-300" />
          </div>
          <h2 className="text-xl font-black text-stone-700 mb-2">Aucune facture</h2>
          <p className="text-stone-400 text-sm">Vos factures apparaîtront ici après validation de vos commandes.</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv, i) => (
            <motion.div key={inv.id}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                inv.status === 'OVERDUE'         ? 'border-red-200' :
                inv.status === 'PAID'            ? 'border-emerald-100' :
                inv.status === 'PENDING_PAYMENT' ? 'border-violet-200' :
                                                   'border-stone-100'
              }`}
            >
              {/* Colored top bar */}
              {inv.status === 'OVERDUE'         && <div className="h-1 bg-gradient-to-r from-red-400 to-orange-400" />}
              {inv.status === 'PAID'            && <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-400" />}
              {inv.status === 'PENDING_PAYMENT' && <div className="h-1 bg-gradient-to-r from-violet-400 to-purple-400" />}

              <div className="p-5">
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={13} className="text-stone-400" />
                      <p className="font-mono text-sm font-bold text-stone-700">{inv.invoiceNumber ?? `Facture #${inv.id}`}</p>
                    </div>
                    {inv.orderNumber && (
                      <p className="text-xs text-stone-400">
                        Commande : <span className="font-mono font-semibold text-stone-500">{inv.orderNumber}</span>
                      </p>
                    )}
                    <p className="text-xs text-stone-400 mt-0.5">
                      Émise le {new Date(inv.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${STATUS_COLORS[inv.status]}`}>
                    {STATUS_ICONS[inv.status]}{STATUS_LABELS[inv.status]}
                  </span>
                </div>

                {/* Amount + due date */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-stone-900">{inv.totalAmount.toLocaleString('fr-FR')}</span>
                      <span className="text-sm text-stone-400 font-bold">FCFA TTC</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                      <span>{(inv.netAmount ?? 0).toLocaleString('fr-FR')} FCFA HT</span>
                      <span className="text-stone-300">+</span>
                      <span>{(inv.taxAmount ?? 0).toLocaleString('fr-FR')} FCFA TVA (18%)</span>
                    </div>
                  </div>
                  <DueDateBadge dueDate={inv.dueDate} status={inv.status} />
                </div>

                {/* "En vérification" info bar */}
                {inv.status === 'PENDING_PAYMENT' && (
                  <div className="mt-3 mb-1 flex items-start gap-2 bg-violet-50 border border-violet-100 rounded-xl px-3 py-2.5">
                    <ShieldCheck size={14} className="text-violet-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-violet-700">Paiement déclaré — en cours de vérification</p>
                      {inv.paymentReference && (
                        <p className="text-xs text-violet-500 mt-0.5">Réf : <span className="font-mono">{inv.paymentReference}</span></p>
                      )}
                      <p className="text-xs text-violet-400 mt-0.5">Notre équipe confirmera votre paiement sous 24h.</p>
                    </div>
                  </div>
                )}

                {/* Actions row */}
                <div className="flex items-center justify-between pt-4">
                  {/* Payment confirmation info */}
                  {inv.paymentMethod && inv.status === 'PAID' ? (
                    <span className="text-xs text-stone-400 flex items-center gap-1.5">
                      <span className="text-base leading-none">{PAY_ICONS[inv.paymentMethod]}</span>
                      Payé par {PAY_LABELS[inv.paymentMethod]}
                      {inv.paidAt && ` · ${new Date(inv.paidAt).toLocaleDateString('fr-FR')}`}
                    </span>
                  ) : <span />}

                  <div className="flex items-center gap-2 ml-auto">
                    {/* Bouton "Régler" pour les factures non payées */}
                    {['UNPAID', 'OVERDUE', 'PARTIAL'].includes(inv.status) && (
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setDeclareModal(inv)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-black text-white bg-stone-900 hover:bg-amber-500 hover:text-stone-900 rounded-xl transition-all duration-200 shadow-md"
                      >
                        <CreditCard size={13} /> Régler
                      </motion.button>
                    )}

                    <button onClick={() => setDetail(inv)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors">
                      Détails <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Client detail modal */}
      <AnimatePresence>
        {detail && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className={`px-6 py-5 border-b ${
                detail.status === 'PAID'            ? 'bg-emerald-50 border-emerald-100' :
                detail.status === 'OVERDUE'         ? 'bg-red-50 border-red-100' :
                detail.status === 'PENDING_PAYMENT' ? 'bg-violet-50 border-violet-100' :
                                                      'bg-stone-50 border-stone-100'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Facture</p>
                    <h3 className="font-mono text-lg font-black text-stone-900">{detail.invoiceNumber ?? `#${detail.id}`}</h3>
                    <span className={`mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${STATUS_COLORS[detail.status]}`}>
                      {STATUS_ICONS[detail.status]}{STATUS_LABELS[detail.status]}
                    </span>
                  </div>
                  <button onClick={() => setDetail(null)} className="p-2 rounded-xl hover:bg-white/60 text-stone-400">
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Big amount */}
                <div className="text-center py-4 border-b border-stone-100">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Montant total</p>
                  <p className="text-4xl font-black text-stone-900">{detail.totalAmount.toLocaleString('fr-FR')}</p>
                  <p className="text-sm text-stone-400 font-bold mt-1">FCFA TTC</p>
                </div>

                {/* Breakdown */}
                <div className="space-y-2">
                  {[
                    { label: 'Montant HT', value: `${(detail.netAmount ?? 0).toLocaleString('fr-FR')} FCFA` },
                    { label: 'TVA 18%',    value: `${(detail.taxAmount ?? 0).toLocaleString('fr-FR')} FCFA` },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-sm px-3 py-2 bg-stone-50 rounded-xl">
                      <span className="text-stone-500">{row.label}</span>
                      <span className="font-semibold text-stone-700">{row.value}</span>
                    </div>
                  ))}
                </div>

                {/* Meta */}
                <div className="space-y-2.5 text-sm border-t border-stone-100 pt-4">
                  {detail.orderNumber && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Commande</span>
                      <span className="font-mono font-bold text-stone-700">{detail.orderNumber}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-400">Émise le</span>
                    <span className="font-semibold">{new Date(detail.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  {detail.dueDate && (
                    <div className="flex justify-between items-center">
                      <span className="text-stone-400">Échéance</span>
                      <DueDateBadge dueDate={detail.dueDate} status={detail.status} />
                    </div>
                  )}
                  {detail.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Mode de paiement</span>
                      <span className="font-semibold flex items-center gap-1.5">
                        <span>{PAY_ICONS[detail.paymentMethod]}</span>
                        {PAY_LABELS[detail.paymentMethod]}
                      </span>
                    </div>
                  )}
                  {detail.paymentReference && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Référence</span>
                      <span className="font-mono font-bold text-stone-700">{detail.paymentReference}</span>
                    </div>
                  )}
                  {detail.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-stone-400">Payée le</span>
                      <span className="font-semibold text-emerald-600">{new Date(detail.paidAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  {['UNPAID', 'OVERDUE', 'PARTIAL'].includes(detail.status) && (
                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => { setDetail(null); setDeclareModal(detail) }}
                      className="flex-1 py-3 bg-stone-900 hover:bg-amber-500 hover:text-stone-900 text-white font-black rounded-2xl text-sm transition-all flex items-center justify-center gap-2">
                      <CreditCard size={15} /> Régler cette facture
                    </motion.button>
                  )}
                  <button onClick={() => setDetail(null)}
                    className="flex-1 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-2xl text-sm transition-colors">
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client declare payment modal */}
      <AnimatePresence>
        {declareModal && (
          <DeclarePaymentModal
            invoice={declareModal}
            onClose={() => setDeclareModal(null)}
            onSuccess={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
