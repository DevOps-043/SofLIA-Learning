'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import { useCourseManagementContext } from './CourseManagementContext'

export function CourseManagementFeedbackToast() {
  const {
    state: { feedbackMessage },
  } = useCourseManagementContext()

  return (
    <AnimatePresence>
      {feedbackMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: 20 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 20 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed right-6 top-6 z-50"
        >
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${
              feedbackMessage.type === 'success'
                ? 'border-success/30 bg-success/10 text-success dark:border-success/40 dark:bg-success/20 dark:text-success'
                : 'border-red-400/30 bg-red-500/10 text-red-600 dark:border-red-400/40 dark:bg-red-500/20 dark:text-red-400'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold">
                {feedbackMessage.type === 'success' ? 'Configuracion guardada' : 'Ocurrio un problema'}
              </p>
              <p className="mt-0.5 text-xs opacity-90">{feedbackMessage.message}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
