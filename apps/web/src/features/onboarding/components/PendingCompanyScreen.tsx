'use client'

import { motion } from 'framer-motion'
import { Clock, Building2, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PendingCompanyScreenProps {
  organizationName?: string
}

export function PendingCompanyScreen({ organizationName }: PendingCompanyScreenProps) {
  const { t } = useTranslation('common')

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md mx-auto text-center"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="w-20 h-20 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-6"
      >
        <Clock className="w-10 h-10 text-amber-400" />
      </motion.div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        {t('orgOnboarding.pendingCompany')}
      </h2>

      {organizationName && (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 text-sm mb-4">
          <Building2 className="w-4 h-4" />
          {organizationName}
        </div>
      )}

      <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
        {t('orgOnboarding.pendingCompanyDesc')}
      </p>

      <div className="p-4 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          <Mail className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
          <span>
            Si tienes dudas, escríbenos a{' '}
            <a href="mailto:ventas@aprendeyaplica.com" className="text-teal-400 hover:text-teal-300">
              ventas@aprendeyaplica.com
            </a>
          </span>
        </div>
      </div>
    </motion.div>
  )
}
