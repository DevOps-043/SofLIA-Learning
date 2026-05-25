import { motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function HierarchyErrorBanner({
  error,
  onClose,
}: {
  error: string | null
  onClose: () => void
}) {
  const { t: tc } = useTranslation('common')
  if (!error) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4"
    >
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
      <p className="flex-1 text-sm text-red-400">{error}</p>
      <button
        onClick={onClose}
        className="rounded-lg px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
      >
        {tc('actions.close')}
      </button>
    </motion.div>
  )
}
