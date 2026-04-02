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
            className="w-full max-w-md rounded-2xl border border-[#E9ECEF] bg-white p-6 shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F59E0B]/10">
                <ArrowRightLeft className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#0A2540] dark:text-white">Mover Leccion</h3>
                <p className="text-xs text-[#6C757D] dark:text-white/60">Selecciona el modulo de destino</p>
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
                      ? 'cursor-not-allowed border-transparent bg-[#E9ECEF]/50 opacity-50'
                      : 'border-[#E9ECEF] hover:border-[#00D4B3]/50 dark:border-[#6C757D]/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Book
                      className={`h-4 w-4 ${
                        module.module_id === movingLesson.module_id ? 'text-[#6C757D]' : 'text-[#00D4B3]'
                      }`}
                    />
                    <span className="max-w-[200px] truncate text-sm font-medium text-[#0A2540] dark:text-white">
                      {module.module_title}
                    </span>
                  </div>
                  {module.module_id === movingLesson.module_id ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6C757D]">Actual</span>
                  ) : (
                    <ChevronRight className="h-4 w-4 text-[#6C757D]/30 transition-colors group-hover:text-[#00D4B3]" />
                  )}
                </motion.button>
              ))}
            </div>

            <div className="mt-6 flex justify-end border-t border-[#E9ECEF] pt-6 dark:border-[#6C757D]/30">
              <button
                onClick={() => setShowMoveLessonModal(false)}
                className="px-4 py-2 text-sm font-semibold text-[#6C757D] transition-colors hover:text-[#0A2540] dark:text-white/60 dark:hover:text-white"
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
