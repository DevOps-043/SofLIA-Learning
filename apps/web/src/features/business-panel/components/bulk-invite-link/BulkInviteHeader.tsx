'use client'

import { motion } from 'framer-motion'
import { Link2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BulkInviteHeaderProps {
  onClose: () => void
}

export function BulkInviteHeader({ onClose }: BulkInviteHeaderProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div
      className="p-6 border-b"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent), color-mix(in srgb, ${theme.accentColor} 6.3%, transparent))`,
        borderColor: theme.borderColor,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="p-2 rounded-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${theme.accentColor} 12.5%, transparent)` }}
          >
            <Link2 className="w-6 h-6" style={{ color: theme.accentColor }} />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>
              {t('users.modals.bulkInvite.title', 'Crear Enlace de Invitacion')}
            </h3>
            <p className="text-sm" style={{ color: theme.mutedTextColor }}>
              {t('users.modals.bulkInvite.subtitle', 'Genera un enlace para invitar multiples usuarios')}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors"
          onMouseEnter={event => {
            event.currentTarget.style.backgroundColor = theme.hoverBg
          }}
          onMouseLeave={event => {
            event.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <X className="w-5 h-5" style={{ color: theme.mutedTextColor }} />
        </button>
      </div>
    </div>
  )
}
