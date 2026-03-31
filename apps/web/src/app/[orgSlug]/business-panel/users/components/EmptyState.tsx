'use client'

import { motion } from 'framer-motion'
import { UserPlus, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

// ============================================
// COMPONENTE: Empty State Premium
// ============================================
function EmptyState({ onAddClick, primaryColor, secondaryColor }: { onAddClick: () => void, primaryColor: string, secondaryColor: string }) {
  const { t } = useTranslation('business')
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-12 text-center"
      style={{ backgroundColor: isDark ? 'var(--org-card-background, #1E2329)' : '#FFFFFF' }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${primaryColor} 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Floating Particles */}
      <motion.div
        className="absolute top-10 left-20 w-3 h-3 rounded-full"
        style={{ backgroundColor: primaryColor }}
        animate={{ y: [0, -15, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-32 w-2 h-2 rounded-full"
        style={{ backgroundColor: secondaryColor }}
        animate={{ y: [0, 10, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />

      {/* Content */}
      <div className="relative z-10">
        <motion.div
          className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: `${primaryColor}15` }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <UserPlus className="w-12 h-12" style={{ color: primaryColor, opacity: 0.6 }} />
        </motion.div>

        <h3 className="text-2xl font-bold mb-3" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
          {t('users.empty.title')}
        </h3>

        <p className="text-sm opacity-60 mb-6 max-w-md mx-auto leading-relaxed" style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>
          {t('users.empty.subtitle')}
        </p>

        <motion.button
          onClick={onAddClick}
          className="px-6 py-3 rounded-xl font-bold text-white transition-all"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 8px 30px ${primaryColor}40`
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Plus className="w-5 h-5 inline mr-2" />
          {t('users.empty.cta')}
        </motion.button>
      </div>
    </motion.div>
  )
}

export { EmptyState }
