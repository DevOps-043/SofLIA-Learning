'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Plus, Sparkles } from 'lucide-react'
import { adminCommunitiesColors } from './shared'

interface AdminCommunitiesHeaderProps {
  onCreate: () => void
}

export function AdminCommunitiesHeader({ onCreate }: AdminCommunitiesHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-3xl p-8"
      style={{
        background: `linear-gradient(135deg, ${adminCommunitiesColors.primary} 0%, ${adminCommunitiesColors.bgSecondary} 100%)`,
        border: `1px solid ${adminCommunitiesColors.accent}20`
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl"
          style={{ background: adminCommunitiesColors.accent }}
        />
        <motion.div
          animate={{ x: [0, -50, 0], y: [0, 50, 0], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl"
          style={{ background: adminCommunitiesColors.accent }}
        />
      </div>

      {[...Array(5)].map((_, index) => (
        <motion.div
          key={index}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
          transition={{ duration: 3 + index, repeat: Infinity, delay: index * 0.5 }}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: adminCommunitiesColors.accent,
            left: `${20 + index * 15}%`,
            top: `${30 + (index % 3) * 20}%`
          }}
        />
      ))}

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
              <Sparkles className="w-6 h-6" style={{ color: adminCommunitiesColors.accent }} />
            </motion.div>
            <span className="text-sm font-medium tracking-widest uppercase" style={{ color: adminCommunitiesColors.accent }}>
              Panel de Gestion
            </span>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">Comunidades</h1>
          <p className="text-lg text-white/60 max-w-xl">
            Administra, modera y haz crecer las comunidades de tu plataforma de aprendizaje.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${adminCommunitiesColors.accent}40` }}
          whileTap={{ scale: 0.95 }}
          onClick={onCreate}
          className="flex items-center gap-2 px-6 py-4 rounded-2xl font-semibold text-white shadow-lg self-start"
          style={{
            background: `linear-gradient(135deg, ${adminCommunitiesColors.accent} 0%, ${adminCommunitiesColors.primary} 100%)`,
            boxShadow: `0 10px 40px ${adminCommunitiesColors.accent}30`
          }}
        >
          <Plus className="w-5 h-5" />
          <span>Crear Comunidad</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  )
}
