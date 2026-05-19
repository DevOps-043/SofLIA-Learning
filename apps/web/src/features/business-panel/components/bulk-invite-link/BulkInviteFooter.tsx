'use client'

import { motion } from 'framer-motion'
import { Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ModalStatus } from './types'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BulkInviteFooterProps {
  status: ModalStatus
  onClose: () => void
}

export function BulkInviteFooter({ status, onClose }: BulkInviteFooterProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const isLoading = status === 'loading'

  return (
    <div className="p-6 border-t flex items-center justify-end gap-3 shrink-0" style={{ borderColor: theme.borderColor }}>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
        style={{ color: theme.mutedTextColor, backgroundColor: theme.inputBg }}
      >
        {t('users.buttons.cancel', 'Cancelar')}
      </button>
      <motion.button
        type="submit"
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        disabled={isLoading}
        className="px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-70"
        style={{
          backgroundColor: theme.primaryColor,
          color: theme.onPrimaryColor,
          boxShadow: `0 4px 15px color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent)`,
        }}
      >
        {isLoading ? (
          <span>{t('users.buttons.creating', 'Creando...')}</span>
        ) : (
          <>
            <Link2 className="w-4 h-4" />
            <span>{t('users.buttons.createLink', 'Crear Enlace')}</span>
          </>
        )}
      </motion.button>
    </div>
  )
}
