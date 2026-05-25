import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { CalendarDeleteConfirmDialogProps } from './types'

export function CalendarDeleteConfirmDialog({ confirmDialog, isDeletingEvent }: CalendarDeleteConfirmDialogProps) {
  const { t } = useTranslation('common')
  return (
    <AnimatePresence>
      {confirmDialog.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) confirmDialog.onCancel() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-carbon-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-500/30"
          >
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-500/30">
              <h3 className="text-base font-semibold text-primary dark:text-white">{t('studyPlanner.calendar.confirmDelete')}</h3>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-300">{confirmDialog.message}</p>
            </div>
            <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-500/30 flex items-center justify-end gap-3">
              <button onClick={confirmDialog.onCancel} className="px-5 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-primary/20 rounded-md transition-colors duration-200">
                {t('studyPlanner.calendar.cancel')}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                disabled={isDeletingEvent}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingEvent ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('studyPlanner.calendar.deleting')}</>
                ) : (
                  t('studyPlanner.calendar.delete')
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
