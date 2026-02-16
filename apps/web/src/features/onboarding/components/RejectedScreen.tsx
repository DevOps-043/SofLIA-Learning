'use client'

import { motion } from 'framer-motion'
import { XCircle, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface RejectedScreenProps {
  organizationName?: string
  onTryAgain: () => void
}

export function RejectedScreen({ organizationName, onTryAgain }: RejectedScreenProps) {
  const { t } = useTranslation('common')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
        <XCircle className="w-10 h-10 text-red-400" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        {t('orgOnboarding.rejected')}
      </h2>

      <p className="text-gray-400 mb-8 leading-relaxed">
        {t('orgOnboarding.rejectedDesc', { company: organizationName || '' })}
      </p>

      <button
        onClick={onTryAgain}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition-colors border border-white/10"
      >
        <RotateCcw className="w-4 h-4" />
        {t('orgOnboarding.tryAgain')}
      </button>
    </motion.div>
  )
}
