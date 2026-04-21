'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

interface StudyPlannerIntroStepNavigationProps {
  currentStep: number
  isLastStep: boolean
  onComplete: () => void
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
}

export function StudyPlannerIntroStepNavigation({
  currentStep,
  isLastStep,
  onComplete,
  onNext,
  onPrevious,
  onSkip,
}: StudyPlannerIntroStepNavigationProps) {
  return (
    <>
      <div className="mt-2 flex flex-col items-center justify-center gap-2 sm:mt-3 sm:flex-row md:mt-4">
        {currentStep > 0 && (
          <motion.button
            onClick={onPrevious}
            whileHover={{ scale: 1.08, x: -4, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 shadow-md transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:w-auto sm:px-5 sm:text-sm"
          >
            <span className="relative z-10">Anterior</span>
          </motion.button>
        )}

        {!isLastStep ? (
          <motion.button
            onClick={onNext}
            whileHover={{ scale: 1.08, boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)' }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 px-5 py-2 text-xs font-semibold text-white shadow-xl shadow-blue-500/30 sm:w-auto sm:px-6 sm:text-sm dark:shadow-blue-500/20"
          >
            <span className="relative z-10">Siguiente</span>
            <motion.span
              className="relative z-10"
              whileHover={{ x: 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <ChevronRight size={16} className="sm:h-4 sm:w-4" />
            </motion.span>
          </motion.button>
        ) : (
          <motion.button
            onClick={onComplete}
            whileHover={{ scale: 1.1, boxShadow: '0 10px 30px rgba(34, 197, 94, 0.5)' }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-2 text-sm font-bold text-white shadow-xl shadow-green-500/30 sm:w-auto sm:px-8 sm:py-2.5 sm:text-base dark:shadow-green-500/20"
          >
            <span className="relative z-10">Comenzar</span>
          </motion.button>
        )}
      </div>

      {!isLastStep && (
        <motion.div
          className="mt-2 text-center sm:mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.button
            onClick={onSkip}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="group relative text-xs font-medium text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 sm:text-sm"
          >
            <span className="relative z-10">Saltar introduccion</span>
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400 dark:bg-gray-500"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      )}
    </>
  )
}
