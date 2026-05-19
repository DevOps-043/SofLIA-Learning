'use client'

import { motion } from 'framer-motion'
import { Check, CheckCircle, Copy } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { CreatedLink, RoleLabels } from './types'
import { BulkInviteSuccessActions } from './BulkInviteSuccessActions'
import { BulkInviteSuccessStats } from './BulkInviteSuccessStats'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface BulkInviteSuccessProps {
  createdLink: CreatedLink
  inviteUrl: string
  copied: boolean
  roleLabels: RoleLabels
  onClose: () => void
  onCopy: () => void
  onCreateAnother: () => void
}

export function BulkInviteSuccess({
  createdLink,
  inviteUrl,
  copied,
  roleLabels,
  onClose,
  onCopy,
  onCreateAnother,
}: BulkInviteSuccessProps) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: `color-mix(in srgb, ${theme.accentColor} 12.5%, transparent)` }}
        >
          <CheckCircle className="w-10 h-10" style={{ color: theme.accentColor }} />
        </motion.div>
        <h4 className="text-xl font-bold mb-2" style={{ color: theme.textColor }}>
          {t('users.modals.bulkInvite.success.title', 'Enlace creado')}
        </h4>
        <p style={{ color: theme.mutedTextColor }}>
          {t('users.modals.bulkInvite.success.subtitle', 'Comparte este enlace con las personas que deseas invitar')}
        </p>
      </div>
      <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium mb-1" style={{ color: theme.mutedTextColor }}>
              {t('users.modals.bulkInvite.success.linkLabel', 'Enlace de invitacion')}
            </p>
            <p className="text-sm font-mono truncate" style={{ color: theme.textColor }}>{inviteUrl}</p>
          </div>
          <button
            onClick={onCopy}
            className="p-2 rounded-lg transition-colors flex-shrink-0"
            style={{
              backgroundColor: copied ? `color-mix(in srgb, ${theme.accentColor} 12.5%, transparent)` : theme.inputBg,
              color: copied ? theme.accentColor : theme.textColor,
            }}
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <BulkInviteSuccessStats createdLink={createdLink} roleLabels={roleLabels} />
      <BulkInviteSuccessActions onClose={onClose} onCreateAnother={onCreateAnother} />
    </motion.div>
  )
}
