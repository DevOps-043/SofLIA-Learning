'use client'

import { Eye } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminCompanyCardActionsProps {
  onView: () => void
}

export function AdminCompanyCardActions(props: AdminCompanyCardActionsProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <div className="mt-auto flex items-center gap-2">
      <button type="button" onClick={props.onView} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border px-4 text-xs font-extrabold uppercase tracking-wider transition-all" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor, color: theme.textColor }}>
        <Eye className="h-4 w-4" />
        {t('companies.actions.view')}
      </button>
    </div>
  )
}
