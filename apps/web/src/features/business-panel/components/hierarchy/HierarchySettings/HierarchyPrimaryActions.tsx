import { Sparkles, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function HierarchyPrimaryActions({
  canEnableHierarchy,
  hasStructure,
  isHierarchyEnabled,
  isLoading,
  onCreateStructure,
  onRequestDisable,
  onRequestEnable,
}: {
  canEnableHierarchy: boolean
  hasStructure: boolean
  isHierarchyEnabled: boolean
  isLoading: boolean
  onCreateStructure: () => void
  onRequestDisable: () => void
  onRequestEnable: () => void
}) {
  const { t } = useTranslation('business')

  return (
    <div className="space-y-3">
      {!hasStructure ? (
        <div className="flex items-center gap-4 rounded-xl border border-blue-500/10 bg-blue-500/5 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {t('hierarchy.basicStructureTitle')}
            </p>
            <p className="text-xs text-neutral-500 dark:text-white/40">
              {t('hierarchy.basicStructureDesc')}
            </p>
          </div>
          <button
            onClick={onCreateStructure}
            disabled={isLoading}
            className="rounded-xl bg-[#0A2540] px-6 py-2.5 text-[10px] font-black uppercase tracking-widest !text-white shadow-xl transition-all hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#00D4B3] dark:!text-[#0A2540]"
          >
            {isLoading ? t('hierarchy.creating') : t('hierarchy.creating2')}
          </button>
        </div>
      ) : null}
      {hasStructure ? (
        <div className="flex items-center gap-4">
          {!isHierarchyEnabled ? (
            <button
              onClick={onRequestEnable}
              disabled={!canEnableHierarchy || isLoading}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {t('hierarchy.enableLabel')}
              </span>
            </button>
          ) : (
            <button
              onClick={onRequestDisable}
              disabled={isLoading}
              className="rounded-xl border border-neutral-200 bg-neutral-100 px-5 py-2.5 text-sm font-bold text-neutral-600 transition-all duration-200 hover:scale-[1.02] hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:border-red-500/20 dark:hover:bg-red-500/10 dark:hover:text-red-400"
            >
              {t('hierarchy.disableLabel')}
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
