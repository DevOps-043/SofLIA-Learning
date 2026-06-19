import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'

const CONFIRM_BUTTON_STYLES = {
  default: 'hover:brightness-110',
  success: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25',
  danger: 'bg-red-600 hover:bg-red-700 shadow-red-600/25',
  neutral: 'bg-neutral-600 hover:bg-neutral-700 shadow-neutral-600/25',
}

export function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmVariant = 'default',
  onConfirm,
  onCancel,
  isLoading,
}: {
  title: string
  message: string
  confirmLabel: string
  confirmVariant?: keyof typeof CONFIRM_BUTTON_STYLES
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="mx-4 w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-carbon-800"
      >
        <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">{title}</h3>
        <p className="mb-6 text-sm leading-relaxed text-neutral-600 dark:text-white/50">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:text-white/60 dark:hover:bg-white/5"
          >
            {t('hierarchy.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${CONFIRM_BUTTON_STYLES[confirmVariant]}`}
            style={confirmVariant === 'default' ? {
              backgroundColor: theme.actionColor,
              color: theme.onActionColor,
            } : undefined}
          >
            {isLoading ? t('hierarchy.processing') : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
