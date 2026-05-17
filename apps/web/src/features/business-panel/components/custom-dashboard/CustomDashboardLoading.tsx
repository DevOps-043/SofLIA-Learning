import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

export function CustomDashboardLoading() {
  const theme = useBusinessPanelTheme()

  return (
    <div className="flex items-center justify-center py-20">
      <div
        className="h-16 w-16 animate-spin rounded-full border-4"
        style={{ borderColor: `${theme.actionColor}33`, borderTopColor: theme.actionColor }}
      />
    </div>
  )
}
