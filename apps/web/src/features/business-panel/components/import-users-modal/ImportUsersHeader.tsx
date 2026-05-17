'use client'

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { ImportResult } from './import-users.types'

export function ImportUsersHeader({
  importResult,
  onClose,
}: {
  importResult: ImportResult | null
  onClose: () => void
}) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div className="flex items-center justify-between p-4 lg:p-6 border-b shrink-0" style={{ borderColor: theme.borderColor }}>
      <div>
        <h3 className="text-lg font-semibold" style={{ color: theme.textColor }}>
          {importResult ? t('users.modals.import.resultTitle') : t('users.modals.import.uploadTitle')}
        </h3>
        <p className="text-sm mt-0.5" style={{ color: theme.mutedTextColor }}>
          {importResult ? t('users.modals.import.resultSubtitle') : t('users.modals.import.uploadSubtitle')}
        </p>
      </div>
      <button onClick={onClose} className="p-2 rounded-lg transition-colors">
        <X className="w-5 h-5" style={{ color: theme.mutedTextColor }} />
      </button>
    </div>
  )
}
