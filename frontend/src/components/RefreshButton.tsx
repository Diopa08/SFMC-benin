import { RefreshCw } from 'lucide-react'

interface Props {
  onClick: () => void
  loading?: boolean
  className?: string
}

export default function RefreshButton({ onClick, loading = false, className = '' }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      title="Actualiser"
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      <span className="hidden sm:inline">Actualiser</span>
    </button>
  )
}
