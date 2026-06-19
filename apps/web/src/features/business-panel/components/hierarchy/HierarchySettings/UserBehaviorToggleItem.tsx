import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

type UserBehaviorToggleItemData = {
  key: 'auto_assign_new_users' | 'require_team_assignment'
  icon: ComponentType<{ className?: string }>
  label: string
  description: string
  value: boolean
}

export function UserBehaviorToggleItem({
  isBusy,
  isSaved,
  item,
  onToggle,
}: {
  isBusy: boolean
  isSaved: boolean
  item: UserBehaviorToggleItemData
  onToggle: () => void
}) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const Icon = item.icon

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      transition={{ duration: 0.15 }}
      className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${item.value ? 'border-blue-500/15 bg-blue-500/5 dark:border-blue-500/15 dark:bg-blue-500/5' : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200 dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-white/10'}`}
    >
      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors ${item.value ? 'bg-blue-500/10 dark:bg-blue-500/15' : 'bg-neutral-100 dark:bg-white/5'}`}>
        <Icon className={`h-5 w-5 transition-colors ${item.value ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-white/30'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item.label}</p>
          {isSaved ? (
            <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              {t('hierarchy.saved')}
            </motion.span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-white/40">
          {item.description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={item.value}
        disabled={isBusy}
        onClick={onToggle}
        className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-action-color)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-carbon-800 ${item.value ? '' : 'bg-neutral-300 dark:bg-white/15'}`}
        style={item.value ? { backgroundColor: theme.actionColor } : undefined}
      >
        <span className={`pointer-events-none ml-1 mt-1 inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform duration-300 ease-in-out ${item.value ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </motion.div>
  )
}
