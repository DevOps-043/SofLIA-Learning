'use client'

import { Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface ViewReporteFooterProps {
  onClose: () => void
  onEdit: () => void
}

export function ViewReporteFooter({ onClose, onEdit }: ViewReporteFooterProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <footer className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: theme.borderColor, backgroundColor: theme.inputBg }}>
      <button type="button" onClick={onClose} className="rounded-2xl border px-5 py-2.5 text-sm font-semibold" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>{t('reportesPage.actions.close')}</button>
      <button type="button" onClick={onEdit} className="rounded-2xl px-5 py-2.5 text-sm font-semibold" style={{ backgroundColor: theme.primaryColor, color: theme.onPrimaryColor }}><Pencil className="mr-2 inline h-4 w-4" />{t('reportesPage.actions.manage')}</button>
    </footer>
  )
}
