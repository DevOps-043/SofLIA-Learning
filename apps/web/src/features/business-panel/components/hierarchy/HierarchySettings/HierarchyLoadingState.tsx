import { useTranslation } from 'react-i18next'

export function HierarchyLoadingState() {
  const { t } = useTranslation('business')

  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-[#00D4B3]" />
        <p className="truncate text-[10px] font-black uppercase tracking-widest text-[#0A2540] dark:text-white/30">
          {t('hierarchy.loadingConfig')}
        </p>
      </div>
    </div>
  )
}
