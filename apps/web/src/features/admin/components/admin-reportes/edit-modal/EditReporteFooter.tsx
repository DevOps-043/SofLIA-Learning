'use client'

import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface EditReporteFooterProps {
  isProcessing: boolean
  onClose: () => void
  onSave: () => void
}

export function EditReporteFooter({ isProcessing, onClose, onSave }: EditReporteFooterProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <footer className="flex justify-end gap-3 border-t px-6 py-4" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
      <button type="button" onClick={onClose} disabled={isProcessing} className="rounded-2xl border px-5 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>{t('reportesPage.actions.cancel')}</button>
      <button type="button" onClick={onSave} disabled={isProcessing} className="rounded-2xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}>
        {isProcessing ? <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 inline h-4 w-4" />}
        {t(isProcessing ? 'reportesPage.actions.saving' : 'reportesPage.actions.saveChanges')}
      </button>
    </footer>
  )
}
