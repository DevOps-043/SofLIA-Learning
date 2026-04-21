'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Loader2, Search, X } from 'lucide-react';

import type { StudyPlannerCourseOption } from '../types/planner-ui.types';
import { StudyPlannerCourseSelectorCourseItem } from './StudyPlannerCourseSelectorCourseItem';

interface StudyPlannerCourseSelectorModalProps {
  isOpen: boolean;
  courses: StudyPlannerCourseOption[];
  selectedCourseIds: string[];
  isLoading: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  onToggleCourse: (courseId: string) => void;
  onConfirm: () => void;
  onClose?: () => void;
}

function getSelectedCoursesLabel(selectedCount: number) {
  if (selectedCount === 0) {
    return 'Ningun curso seleccionado';
  }

  return '1 curso seleccionado';
}

export function StudyPlannerCourseSelectorModal({
  isOpen,
  courses,
  selectedCourseIds,
  isLoading,
  searchQuery,
  onSearchChange,
  onClearSearch,
  onToggleCourse,
  onConfirm,
  onClose,
}: StudyPlannerCourseSelectorModalProps) {
  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const hasCourses = courses.length > 0;
  const hasSelectedCourses = selectedCourseIds.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#E9ECEF] bg-white shadow-2xl dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
          >
            <div className="relative border-b border-[#E9ECEF] bg-[#0A2540]/5 p-5 pb-4 dark:border-[#6C757D]/30 dark:bg-[#0A2540]/10">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-lg border border-[#0A2540]/20 bg-[#0A2540]/10 p-2.5 dark:border-[#00D4B3]/30 dark:bg-[#0A2540]/20">
                  <BookOpen className="h-5 w-5 text-[#0A2540] dark:text-[#00D4B3]" />
                </div>
                <div className="flex-1">
                  <h3 className="mb-1 text-lg font-bold text-[#0A2540] dark:text-white">¿Que curso quieres planificar?</h3>
                  <p className="text-xs text-[#6C757D] dark:text-gray-400">
                    Selecciona un curso a la vez para crear tu plan de estudios
                  </p>
                </div>
                {onClose && (
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="rounded-lg p-1.5 text-[#6C757D] transition-colors hover:bg-[#E9ECEF] hover:text-[#0A2540] dark:hover:bg-[#0A2540]/20 dark:hover:text-white"
                    title="Cerrar"
                  >
                    <X size={18} />
                  </motion.button>
                )}
              </div>

              {hasCourses && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative mt-4"
                >
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6C757D]" />
                  <input
                    type="text"
                    suppressHydrationWarning
                    value={searchQuery}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Buscar cursos..."
                    className="w-full rounded-lg border border-[#E9ECEF] bg-white py-2.5 pl-10 pr-10 text-[#0A2540] transition-all placeholder:text-[#6C757D] focus:border-[#00D4B3]/50 focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/50 dark:border-[#6C757D]/30 dark:bg-[#1E2329] dark:text-white"
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={onClearSearch}
                      className="absolute right-3 top-1/2 rounded p-1 text-[#6C757D] transition-colors hover:bg-[#E9ECEF] hover:text-[#0A2540] dark:hover:bg-[#0A2540]/20 dark:hover:text-white"
                      title="Limpiar busqueda"
                    >
                      <X size={16} />
                    </motion.button>
                  )}
                </motion.div>
              )}
            </div>

            <div className="flex flex-1 flex-col overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center px-6 py-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 className="h-12 w-12 text-[#0A2540] dark:text-[#00D4B3]" />
                  </motion.div>
                  <p className="mt-4 text-sm text-[#6C757D] dark:text-gray-400">Cargando tus cursos...</p>
                </div>
              ) : !hasCourses ? (
                <div className="flex flex-col items-center justify-center px-6 py-16">
                  <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#E9ECEF] dark:bg-[#0A2540]/20">
                    <BookOpen className="h-10 w-10 text-[#6C757D] dark:text-gray-400" />
                  </div>
                  <h4 className="mb-2 font-semibold text-[#0A2540] dark:text-white">No tienes cursos disponibles para planificar</h4>
                  <p className="max-w-sm text-center text-sm text-[#6C757D] dark:text-gray-400">
                    Todos tus cursos ya tienen un plan activo o no tienes cursos asignados por ahora
                  </p>
                </div>
              ) : (
                <>
                  <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto px-6 py-4">
                    {filteredCourses.length === 0 && searchQuery ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Search className="mb-3 h-12 w-12 text-[#6C757D] dark:text-gray-400" />
                        <p className="text-sm text-[#6C757D] dark:text-gray-400">No se encontraron cursos</p>
                        <p className="mt-1 text-xs text-[#6C757D] dark:text-gray-500">Intenta con otro termino de busqueda</p>
                      </div>
                    ) : (
                      filteredCourses.map((course, index) => (
                        <StudyPlannerCourseSelectorCourseItem
                          key={course.id}
                          course={course}
                          index={index}
                          isSelected={selectedCourseIds.includes(course.id)}
                          onToggleCourse={onToggleCourse}
                        />
                      ))
                    )}
                  </div>

                  <div className="border-t border-[#E9ECEF] bg-white px-5 py-4 dark:border-[#6C757D]/30 dark:bg-[#1E2329]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            hasSelectedCourses
                              ? 'border border-[#0A2540]/20 bg-[#0A2540]/10 dark:border-[#00D4B3]/30 dark:bg-[#0A2540]/20'
                              : 'bg-[#E9ECEF] dark:bg-[#6C757D]/30'
                          }`}
                        >
                          <span className={`text-sm font-bold ${hasSelectedCourses ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-[#6C757D]'}`}>
                            {selectedCourseIds.length}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                            {getSelectedCoursesLabel(selectedCourseIds.length)}
                          </p>
                          <p className="text-xs text-[#6C757D] dark:text-gray-400">
                            {hasSelectedCourses ? 'Listo para crear tu plan' : 'Selecciona un curso para continuar'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          onClick={onConfirm}
                          disabled={!hasSelectedCourses}
                          whileHover={hasSelectedCourses ? { scale: 1.05 } : {}}
                          whileTap={hasSelectedCourses ? { scale: 0.95 } : {}}
                          className={`rounded-md px-5 py-2.5 text-sm font-semibold transition-all ${
                            hasSelectedCourses
                              ? 'bg-[#0A2540] text-white shadow-sm hover:bg-[#0d2f4d] dark:bg-[#0A2540] dark:hover:bg-[#0d2f4d]'
                              : 'cursor-not-allowed bg-[#6C757D] text-gray-400'
                          }`}
                        >
                          Aceptar
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
