import { Layout, RefreshCw, Save, Settings, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { DashboardActionButton } from './DashboardActionButton'

interface CustomDashboardToolbarProps {
  isEditMode: boolean
  isSaving: boolean
  onClose?: () => void
  onReset: () => void
  onSave: () => void | Promise<void>
  onToggleEditMode: () => void
  t: (key: string) => string
  tc: (key: string) => string
}

export function CustomDashboardToolbar(props: CustomDashboardToolbarProps) {
  const { isEditMode, isSaving, onClose, onReset, onSave, onToggleEditMode, t, tc } = props
  const theme = useBusinessPanelTheme()

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold" style={{ color: theme.textColor }}>
          <Layout className="h-6 w-6" style={{ color: theme.actionColor }} />
          Dashboard personalizable
        </h2>
        <p className="mt-1" style={{ color: theme.subtextColor }}>Arrastra y organiza los widgets según tus necesidades.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <DashboardActionButton variant={isEditMode ? 'primary' : 'secondary'} onClick={onToggleEditMode}>
          <Settings className="h-4 w-4" />
          {isEditMode ? tc('actions.preview') : tc('actions.customize')}
        </DashboardActionButton>
        {isEditMode && <EditModeActions isSaving={isSaving} onReset={onReset} onSave={onSave} t={t} tc={tc} />}
        {onClose && <DashboardActionButton variant="ghost" onClick={onClose}><X className="h-4 w-4" /></DashboardActionButton>}
      </div>
    </div>
  )
}

function EditModeActions({ isSaving, onReset, onSave, t, tc }: Pick<CustomDashboardToolbarProps, 'isSaving' | 'onReset' | 'onSave' | 't' | 'tc'>) {
  const theme = useBusinessPanelTheme()
  return (
    <>
      <DashboardActionButton variant="secondary" onClick={onReset} disabled={isSaving}>
        <RefreshCw className="h-4 w-4" />
        {t('dashboard.restoreLayout')}
      </DashboardActionButton>
      <DashboardActionButton variant="primary" onClick={() => void onSave()} disabled={isSaving}>
        {isSaving ? <><div className="h-4 w-4 animate-spin rounded-full border-2" style={{ borderColor: `color-mix(in srgb, ${theme.onActionColor} 30.2%, transparent)`, borderTopColor: theme.onActionColor }} />{tc('actions.saving')}</> : <><Save className="h-4 w-4" />{tc('actions.saveChanges')}</>}
      </DashboardActionButton>
    </>
  )
}
