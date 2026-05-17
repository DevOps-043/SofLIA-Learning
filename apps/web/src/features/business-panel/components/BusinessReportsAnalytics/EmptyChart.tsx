import { useTranslation } from 'react-i18next'
import type { ThemeTokens } from './types'

export function EmptyChart({ theme }: { theme: ThemeTokens }) {
  const { t } = useTranslation('business')

  return (
    <div className="flex h-full items-center justify-center rounded-lg border" style={{ borderColor: theme.borderColor, color: theme.subtextColor }}>
      <span className="text-sm">{t('reportsAnalytics.states.emptyChart')}</span>
    </div>
  )
}
