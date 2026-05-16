'use client'

import { CheckCircle2, Eye, PauseCircle, Pencil, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'

interface AdminCompanyCardActionsProps {
  isActive: boolean
  isUpdating: boolean
  shouldShowActivate: boolean
  onView: () => void
  onEdit: () => void
  onToggle: () => void
  onActivate?: () => void
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
      {props.shouldShowActivate ? <AdminCompanyActivateButton isUpdating={props.isUpdating} onClick={props.onActivate} /> : <AdminCompanyManageButtons isActive={props.isActive} isUpdating={props.isUpdating} onEdit={props.onEdit} onToggle={props.onToggle} />}
    </div>
  )
}

function AdminCompanyActivateButton({
  isUpdating,
  onClick,
}: {
  isUpdating: boolean
  onClick?: () => void
}) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <button type="button" onClick={onClick} disabled={isUpdating} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-extrabold uppercase tracking-wider transition-opacity disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: `${theme.successColor}14`, color: theme.successColor }}>
      {isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
      {t('companies.actions.activate')}
    </button>
  )
}

function AdminCompanyManageButtons(props: {
  isActive: boolean
  isUpdating: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  return (
    <>
      <button type="button" onClick={props.onEdit} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-extrabold uppercase tracking-wider transition-all" style={{ backgroundColor: `${theme.primaryColor}14`, color: theme.primaryColor }}>
        <Pencil className="h-4 w-4" />
        {t('companies.actions.edit')}
      </button>
      <button type="button" onClick={props.onToggle} disabled={props.isUpdating} className="flex h-11 w-12 items-center justify-center rounded-2xl transition-opacity disabled:cursor-not-allowed disabled:opacity-50" style={{ backgroundColor: props.isActive ? `${theme.warningColor}14` : `${theme.successColor}14`, color: props.isActive ? theme.warningColor : theme.successColor }} aria-label={props.isActive ? t('companies.actions.pause') : t('companies.actions.activate')} title={props.isActive ? t('companies.actions.pause') : t('companies.actions.activate')}>
        {props.isUpdating ? <RefreshCw className="h-4 w-4 animate-spin" /> : props.isActive ? <PauseCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
      </button>
    </>
  )
}
