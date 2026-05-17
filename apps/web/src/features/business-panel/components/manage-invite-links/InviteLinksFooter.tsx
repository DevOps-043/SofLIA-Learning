'use client'

import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useInviteLinksTheme } from './useInviteLinksTheme'

interface InviteLinksFooterProps {
  linksCount: number
  onClose: () => void
  onCreateNew: () => void
}

export function InviteLinksFooter({ linksCount, onClose, onCreateNew }: InviteLinksFooterProps) {
  const { t } = useTranslation('business')
  const theme = useInviteLinksTheme()

  return (
    <div className="p-6 border-t flex items-center justify-between shrink-0" style={{ borderColor: theme.borderColor }}>
      <p className="text-sm" style={{ color: theme.mutedText }}>
        {linksCount} {linksCount === 1 ? t('users.modals.manageLinks.linkSingular', 'enlace') : t('users.modals.manageLinks.linkPlural', 'enlaces')}
      </p>
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ color: theme.mutedText }}>
          {t('users.buttons.close', 'Cerrar')}
        </button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onCreateNew} className="px-5 py-2.5 rounded-xl text-sm font-medium text-white flex items-center gap-2" style={{ backgroundColor: theme.primaryColor, boxShadow: `0 4px 15px ${theme.primaryColor}40`, color: '#FFFFFF' }}>
          <Plus className="w-4 h-4" />
          {t('users.buttons.newLink', 'Nuevo Enlace')}
        </motion.button>
      </div>
    </div>
  )
}
