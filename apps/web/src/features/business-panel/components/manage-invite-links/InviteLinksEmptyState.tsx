'use client'

import { motion } from 'framer-motion'
import { Link2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useInviteLinksTheme } from './useInviteLinksTheme'

export function InviteLinksEmptyState({ onCreateNew }: { onCreateNew: () => void }) {
  const { t } = useTranslation('business')
  const theme = useInviteLinksTheme()

  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: theme.inputBg }}>
        <Link2 className="w-8 h-8" style={{ color: theme.mutedText }} />
      </div>
      <h4 className="text-lg font-semibold mb-2" style={{ color: theme.textColor }}>{t('users.modals.manageLinks.empty.title', 'No hay enlaces')}</h4>
      <p className="mb-6" style={{ color: theme.mutedText }}>{t('users.modals.manageLinks.empty.subtitle', 'Crea tu primer enlace de invitacion masiva')}</p>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onCreateNew} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2" style={{ backgroundColor: theme.primaryColor, boxShadow: `0 4px 15px color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent)`, color: 'var(--color-bg-light)' }}>
        <Plus className="w-4 h-4" />
        {t('users.buttons.createLink', 'Crear Enlace')}
      </motion.button>
    </div>
  )
}
