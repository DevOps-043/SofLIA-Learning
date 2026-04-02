import { motion } from 'framer-motion'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { BusinessUserDashboardColors } from '../types'

interface BusinessUserDashboardErrorProps {
  orgColors: BusinessUserDashboardColors
  error: string
  onRetry: () => void
}

export function BusinessUserDashboardError({
  orgColors,
  error,
  onRetry,
}: BusinessUserDashboardErrorProps) {
  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: orgColors.sidebarBg }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 max-w-md text-center p-8 rounded-2xl border border-red-500/20 backdrop-blur-xl"
        style={{ backgroundColor: orgColors.cardBg }}
      >
        <div className="p-4 rounded-full bg-red-500/10">
          <AlertCircle className="w-12 h-12 text-red-400" />
        </div>
        <div>
          <p className="text-red-400 text-xl font-semibold">Error al cargar datos</p>
          <p className="text-sm mt-2" style={{ color: orgColors.textSecondary }}>
            {error}
          </p>
        </div>
        <motion.button
          onClick={onRetry}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium"
          style={{
            background: `linear-gradient(135deg, ${orgColors.primary}, ${orgColors.accent})`,
            boxShadow: `0 4px 20px ${orgColors.primary}50`,
            color: '#FFFFFF',
          }}
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </motion.button>
      </motion.div>
    </main>
  )
}
