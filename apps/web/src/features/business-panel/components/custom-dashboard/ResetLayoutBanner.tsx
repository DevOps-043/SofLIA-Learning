import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'

interface ResetLayoutBannerProps {
  isOpen: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export function ResetLayoutBanner({ isOpen, onCancel, onConfirm }: ResetLayoutBannerProps) {
  const theme = useBusinessPanelTheme()
  const { t } = useTranslation('business')
  const { t: tc } = useTranslation('common')

  if (!isOpen) return null

  return (
    <div className="p-3 rounded-lg border flex items-center justify-between gap-3" style={{ backgroundColor: `${theme.dangerColor}12`, borderColor: `${theme.dangerColor}33` }}>
      <p className="text-sm" style={{ color: theme.dangerColor }}>{t('dashboard.confirmResetLayout')}</p>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded border transition-colors" style={{ borderColor: `${theme.dangerColor}33`, color: theme.dangerColor }}>{tc('actions.cancel')}</button>
        <button onClick={() => void onConfirm()} className="px-3 py-1.5 text-sm rounded text-white transition-colors" style={{ backgroundColor: theme.dangerColor }}>{tc('actions.confirm')}</button>
      </div>
    </div>
  )
}
