'use client'

import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../hooks/useBusinessPanelTheme'
import { CustomDashboardFatalError } from './custom-dashboard/CustomDashboardFatalError'
import { CustomDashboardLoading } from './custom-dashboard/CustomDashboardLoading'
import { CustomDashboardToolbar } from './custom-dashboard/CustomDashboardToolbar'
import { DashboardGrid } from './custom-dashboard/DashboardGrid'
import { ResetLayoutBanner } from './custom-dashboard/ResetLayoutBanner'
import { useCustomDashboardState } from './custom-dashboard/useCustomDashboardState'
import { WidgetPalette } from './custom-dashboard/WidgetPalette'

interface CustomDashboardProps {
  onClose?: () => void
}

export function CustomDashboard({ onClose }: CustomDashboardProps) {
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')
  const params = useParams()
  const orgSlug = params?.orgSlug as string
  const state = useCustomDashboardState(orgSlug)

  if (state.isLoading) return <CustomDashboardLoading />
  if (state.error && !state.layout) return <CustomDashboardFatalError error={state.error} onRetry={state.fetchLayout} />
  if (!state.layout) return null

  const widgets = state.layout.layout_config.widgets || []

  return (
    <div className="space-y-6">
      <ResetLayoutBanner
        isOpen={state.pendingReset}
        onCancel={() => state.setPendingReset(false)}
        onConfirm={state.handleConfirmReset}
      />
      <CustomDashboardToolbar
        error={state.error}
        isEditMode={state.isEditMode}
        isSaving={state.isSaving}
        onClose={onClose}
        onReset={state.handleReset}
        onSave={state.handleSave}
        onToggleEditMode={() => state.setIsEditMode(current => !current)}
        saveSuccess={state.saveSuccess}
        t={t}
        tc={tc}
      />
      {state.isEditMode && <WidgetPalette onAddWidget={state.addWidget} t={t} />}
      <DashboardGrid
        isEditMode={state.isEditMode}
        onLayoutChange={state.handleLayoutChange}
        onRemoveWidget={state.removeWidget}
        widgets={widgets}
      />
    </div>
  )
}
