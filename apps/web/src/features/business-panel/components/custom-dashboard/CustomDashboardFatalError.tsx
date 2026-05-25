import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface CustomDashboardFatalErrorProps {
  error: string
  onRetry: () => void | Promise<void>
}

export function CustomDashboardFatalError({ error, onRetry }: CustomDashboardFatalErrorProps) {
  const theme = useBusinessPanelTheme()
  const { t: tc } = useTranslation('common')

  return (
    <div className="py-20 text-center">
      <div className="mb-4 text-lg" style={{ color: theme.dangerColor }}>{error}</div>
      <button
        type="button"
        onClick={() => void onRetry()}
        className="rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        style={{ backgroundColor: theme.actionColor, color: theme.onActionColor }}
      >
        {tc('actions.retry')}
      </button>
    </div>
  )
}
