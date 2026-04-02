'use client'

import { motion } from 'framer-motion'
import { Users, Zap } from 'lucide-react'
import { adminCommunitiesColors } from './shared'

export function AdminCommunitiesLoadingState() {
  return (
    <div className="min-h-screen p-6 lg:p-8" style={{ background: adminCommunitiesColors.bgPrimary }}>
      <div className="max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-32 rounded-3xl" style={{ background: adminCommunitiesColors.bgSecondary }} />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-36 rounded-2xl" style={{ background: adminCommunitiesColors.bgSecondary }} />
            ))}
          </div>
          <div className="h-16 rounded-2xl" style={{ background: adminCommunitiesColors.bgSecondary }} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-80 rounded-3xl" style={{ background: adminCommunitiesColors.bgSecondary }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface AdminCommunitiesErrorStateProps {
  error: string
  onRetry: () => void
}

export function AdminCommunitiesErrorState({ error, onRetry }: AdminCommunitiesErrorStateProps) {
  return (
    <div className="min-h-screen p-6 lg:p-8 flex items-center justify-center" style={{ background: adminCommunitiesColors.bgPrimary }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 rounded-3xl max-w-md"
        style={{ background: adminCommunitiesColors.bgSecondary }}
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: `${adminCommunitiesColors.error}20` }}>
          <Zap className="w-8 h-8" style={{ color: adminCommunitiesColors.error }} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Error al cargar</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="px-6 py-3 rounded-xl font-semibold text-white"
          style={{ background: `linear-gradient(135deg, ${adminCommunitiesColors.accent} 0%, ${adminCommunitiesColors.primary} 100%)` }}
        >
          Reintentar
        </motion.button>
      </motion.div>
    </div>
  )
}

interface AdminCommunitiesEmptyStateProps {
  onCreate: () => void
}

export function AdminCommunitiesEmptyState({ onCreate }: AdminCommunitiesEmptyStateProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ background: `${adminCommunitiesColors.accent}10` }}>
        <Users className="w-12 h-12" style={{ color: adminCommunitiesColors.accent }} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">No se encontraron comunidades</h3>
      <p className="text-gray-400 mb-6">Intenta ajustar los filtros o crear una nueva comunidad</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreate}
        className="px-6 py-3 rounded-xl font-semibold text-white"
        style={{ background: `linear-gradient(135deg, ${adminCommunitiesColors.accent} 0%, ${adminCommunitiesColors.primary} 100%)` }}
      >
        Crear Comunidad
      </motion.button>
    </motion.div>
  )
}
