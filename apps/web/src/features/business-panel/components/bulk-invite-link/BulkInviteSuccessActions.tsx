'use client'

import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BulkInviteSuccessActionsProps {
  onClose: () => void
  onCreateAnother: () => void
}

export function BulkInviteSuccessActions({
  onClose,
  onCreateAnother,
}: BulkInviteSuccessActionsProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: theme.borderColor }}>
      <button
        onClick={onCreateAnother}
        className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        style={{ color: theme.mutedTextColor, backgroundColor: theme.inputBg }}
      >
        {t('users.buttons.createAnother', 'Crear otro')}
      </button>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClose}
        className="px-5 py-2.5 rounded-xl text-sm font-medium"
        style={{
          backgroundColor: theme.primaryColor,
          color: theme.onPrimaryColor,
          boxShadow: `0 4px 15px ${theme.primaryColor}40`,
        }}
      >
        {t('users.buttons.done', 'Listo')}
      </motion.button>
    </div>
  )
}
