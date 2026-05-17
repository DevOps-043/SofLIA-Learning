'use client'

import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export function BulkInviteInfoNote() {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div className="p-4 rounded-xl border" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <div className="flex items-start gap-3">
        <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: theme.accentColor }} />
        <p className="text-sm" style={{ color: theme.mutedTextColor }}>
          {t('users.modals.bulkInvite.hints.info', 'El enlace permitira que cualquier persona se registre en tu organizacion con el rol especificado. Puedes pausar o eliminar el enlace en cualquier momento.')}
        </p>
      </div>
    </div>
  )
}
