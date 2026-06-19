import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

export function HierarchyLoadingState() {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2" style={{ borderBottomColor: theme.actionColor }} />
        <p className="truncate text-[10px] font-black uppercase tracking-widest" style={{ color: theme.actionColor }}>
          {t('hierarchy.loadingConfig')}
        </p>
      </div>
    </div>
  )
}
