'use client'

import { CheckCircle2, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'

interface EditReporteHeaderProps {
  onClose: () => void
}

export function EditReporteHeader({ onClose }: EditReporteHeaderProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <header className="flex items-center justify-between border-b px-6 py-5" style={{ borderColor: theme.borderColor }}>
      <h2 className="flex items-center gap-2 text-lg font-semibold" style={{ color: theme.textColor }}>
        <CheckCircle2 className="h-5 w-5" style={{ color: theme.primaryColor }} />
        {t('reportesPage.editModal.title')}
      </h2>
      <button type="button" onClick={onClose} className="rounded-2xl border p-2" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>
        <X className="h-4 w-4" />
      </button>
    </header>
  )
}
