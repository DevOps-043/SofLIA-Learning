import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { CheckCircle, Layout, RefreshCw, Save, Settings, X } from 'lucide-react'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { DashboardActionButton } from './DashboardActionButton'

interface CustomDashboardToolbarProps {
  error: string | null
  isEditMode: boolean
  isSaving: boolean
  onClose?: () => void
  onReset: () => void
  onSave: () => void | Promise<void>
  onToggleEditMode: () => void
  saveSuccess: boolean
  t: (key: string) => string
  tc: (key: string) => string
}

export function CustomDashboardToolbar(props: CustomDashboardToolbarProps) {
  const { error, isEditMode, isSaving, onClose, onReset, onSave, onToggleEditMode, saveSuccess, t, tc } = props
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
        {saveSuccess && <ToolbarNotice color={theme.successColor} icon={<CheckCircle className="h-5 w-5" />} text={tc('actions.savedSuccessfully')} />}
        {error && <ToolbarNotice color={theme.dangerColor} text={error} />}
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

function ToolbarNotice({ color, icon, text }: { color: string; icon?: ReactNode; text: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-lg border px-4 py-2" style={{ backgroundColor: `color-mix(in srgb, ${color} 7.1%, transparent)`, borderColor: `color-mix(in srgb, ${color} 20%, transparent)`, color }}>
      {icon}
      <span>{text}</span>
    </motion.div>
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
