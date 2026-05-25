'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRightLeft, Book, ChevronRight } from 'lucide-react'

import { useCourseManagementContext } from './CourseManagementContext'

export function CourseManagementMoveLessonModal() {
  const {
    state: {
      showMoveLessonModal,
      setShowMoveLessonModal,
      movingLesson,
      modules,
      handleMoveLessonToModule,
    },
  } = useCourseManagementContext()

  return (
    <AnimatePresence>
      {showMoveLessonModal && movingLesson && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setShowMoveLessonModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-500/30 dark:bg-carbon-800"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <ArrowRightLeft className="h-5 w-5 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary dark:text-white">Mover Leccion</h3>
                <p className="text-xs text-gray-500 dark:text-white/60">Selecciona el modulo de destino</p>
              </div>
            </div>

            <div className="custom-scrollbar max-h-[300px] space-y-3 overflow-y-auto pr-2">
              {modules.map((module) => (
                <motion.button
                  key={module.module_id}
                  onClick={() => handleMoveLessonToModule(module.module_id)}
                  disabled={module.module_id === movingLesson.module_id}
                  whileHover={
                    module.module_id !== movingLesson.module_id
                      ? { x: 4, backgroundColor: 'rgba(0,0,0,0.05)' }
                      : {}
                  }
                  className={`group flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    module.module_id === movingLesson.module_id
                      ? 'cursor-not-allowed border-transparent bg-gray-200/50 opacity-50'
                      : 'border-gray-200 hover:border-accent/50 dark:border-gray-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Book
                      className={`h-4 w-4 ${
                        module.module_id === movingLesson.module_id ? 'text-gray-500' : 'text-accent'
                      }`}
                    />
                    <span className="max-w-[200px] truncate text-sm font-medium text-primary dark:text-white">
                      {module.module_title}
                    </span>
                  </div>
                  {module.module_id === movingLesson.module_id ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Actual</span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500/30 transition-colors group-hover:text-accent" />
                  )}
                </motion.button>
              ))}
            </div>

            <div className="mt-6 flex justify-end border-t border-gray-200 pt-6 dark:border-gray-500/30">
              <button
                onClick={() => setShowMoveLessonModal(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-500 transition-colors hover:text-primary dark:text-white/60 dark:hover:text-white"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
