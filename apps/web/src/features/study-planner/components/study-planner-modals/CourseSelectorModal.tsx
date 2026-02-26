'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, X, Check, Loader2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: string;
  progress: number;
}

interface CourseSelectorModalProps {
  show: boolean;
  availableCourses: Course[];
  selectedCourseIds: string[];
  courseSearchQuery: string;
  isLoadingCourses: boolean;
  onSearchChange: (query: string) => void;
  onToggleCourse: (courseId: string) => void;
  onConfirm: () => void;
}

export function CourseSelectorModal({
  show,
  availableCourses,
  selectedCourseIds,
  courseSearchQuery,
  isLoadingCourses,
  onSearchChange,
  onToggleCourse,
  onConfirm,
}: CourseSelectorModalProps) {
  if (!show) return null;

  const filteredCourses = availableCourses.filter(course =>
    course.title.toLowerCase().includes(courseSearchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
    >
      {/* Overlay con blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-5 pb-4 border-b border-[#E9ECEF] dark:border-[#6C757D]/30 bg-[#0A2540]/5 dark:bg-[#0A2540]/10">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2.5 bg-[#0A2540]/10 dark:bg-[#0A2540]/20 rounded-lg border border-[#0A2540]/20 dark:border-[#00D4B3]/30">
              <BookOpen className="w-5 h-5 text-[#0A2540] dark:text-[#00D4B3]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#0A2540] dark:text-white mb-1">Selecciona tus cursos</h3>
              <p className="text-[#6C757D] dark:text-gray-400 text-xs">Elige los cursos que quieres incluir en tu plan de estudios</p>
            </div>
          </div>

          {/* Barra de búsqueda */}
          {availableCourses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mt-4"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C757D]" />
              <input
                type="text"
                suppressHydrationWarning
                value={courseSearchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar cursos..."
                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-[#1E2329] border border-[#E9ECEF] dark:border-[#6C757D]/30 rounded-lg text-[#0A2540] dark:text-white placeholder-[#6C757D] focus:outline-none focus:ring-2 focus:ring-[#00D4B3]/50 focus:border-[#00D4B3]/50 transition-all"
              />
              {courseSearchQuery && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#6C757D] hover:text-[#0A2540] dark:hover:text-white transition-colors rounded hover:bg-[#E9ECEF] dark:hover:bg-[#0A2540]/20"
                  title="Limpiar búsqueda"
                >
                  <X size={16} />
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {isLoadingCourses ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-12 h-12 text-[#0A2540] dark:text-[#00D4B3]" />
              </motion.div>
              <p className="text-[#6C757D] dark:text-gray-400 mt-4 text-sm">Cargando tus cursos...</p>
            </div>
          ) : availableCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-[#E9ECEF] dark:bg-[#0A2540]/20 flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-[#6C757D] dark:text-gray-400" />
              </div>
              <h4 className="text-[#0A2540] dark:text-white font-semibold mb-2">No tienes cursos disponibles</h4>
              <p className="text-[#6C757D] dark:text-gray-400 text-sm text-center max-w-sm">
                Adquiere cursos para poder crear tu plan de estudios personalizado
              </p>
            </div>
          ) : (
            <>
              {/* Lista de cursos con scroll */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 custom-scrollbar">
                {filteredCourses.length === 0 && courseSearchQuery ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Search className="w-12 h-12 text-[#6C757D] dark:text-gray-400 mb-3" />
                    <p className="text-[#6C757D] dark:text-gray-400 text-sm">No se encontraron cursos</p>
                    <p className="text-[#6C757D] dark:text-gray-500 text-xs mt-1">Intenta con otro término de búsqueda</p>
                  </div>
                ) : (
                  filteredCourses.map((course, index) => {
                    const isSelected = selectedCourseIds.includes(course.id);
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <motion.button
                          onClick={() => onToggleCourse(course.id)}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all relative overflow-hidden group ${isSelected
                            ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20 border-2 border-[#0A2540]/30 dark:border-[#00D4B3]/30 shadow-sm'
                            : 'bg-[#E9ECEF]/30 dark:bg-[#0A2540]/5 border-2 border-[#E9ECEF] dark:border-[#6C757D]/30 hover:border-[#0A2540]/50 dark:hover:border-[#00D4B3]/50 hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A2540]/10'
                            }`}
                        >
                          {/* Efecto de brillo en hover */}
                          {!isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                          )}

                          {/* Checkbox */}
                          <motion.div
                            className={`relative w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                              ? 'bg-[#0A2540] dark:bg-[#0A2540] shadow-sm'
                              : 'bg-[#E9ECEF] dark:bg-[#6C757D] border-2 border-[#6C757D]/30'
                              }`}
                            animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                              >
                                <Check className="w-4 h-4 text-white font-bold" strokeWidth={3} />
                              </motion.div>
                            )}
                          </motion.div>

                          {/* Información del curso */}
                          <div className="flex-1 text-left min-w-0">
                            <p className={`font-semibold text-sm mb-1 line-clamp-2 ${isSelected ? 'text-[#0A2540] dark:text-white' : 'text-[#0A2540] dark:text-gray-200'
                              }`}>
                              {course.title}
                            </p>
                            {course.progress > 0 && (
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-20 h-1.5 bg-[#E9ECEF] dark:bg-[#6C757D]/30 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-[#0A2540] dark:bg-[#00D4B3]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${course.progress}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                  />
                                </div>
                                <span className={`text-xs font-medium ${isSelected ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-[#6C757D] dark:text-gray-400'
                                  }`}>
                                  {course.progress}% completado
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Indicador de selección */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 rounded-full bg-[#10B981] shadow-lg shadow-[#10B981]/50"
                            />
                          )}
                        </motion.button>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-[#E9ECEF] dark:border-[#6C757D]/30 bg-white dark:bg-[#1E2329]">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedCourseIds.length > 0
                      ? 'bg-[#0A2540]/10 dark:bg-[#0A2540]/20 border border-[#0A2540]/20 dark:border-[#00D4B3]/30'
                      : 'bg-[#E9ECEF] dark:bg-[#6C757D]/30'
                      }`}>
                      <span className={`text-sm font-bold ${selectedCourseIds.length > 0 ? 'text-[#0A2540] dark:text-[#00D4B3]' : 'text-[#6C757D]'
                        }`}>
                        {selectedCourseIds.length}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#0A2540] dark:text-white">
                        {selectedCourseIds.length === 0
                          ? 'Ningún curso seleccionado'
                          : selectedCourseIds.length === 1
                            ? '1 curso seleccionado'
                            : `${selectedCourseIds.length} cursos seleccionados`
                        }
                      </p>
                      <p className="text-xs text-[#6C757D] dark:text-gray-400">
                        {selectedCourseIds.length > 0
                          ? 'Listo para crear tu plan'
                          : 'Selecciona al menos un curso'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      onClick={onConfirm}
                      disabled={selectedCourseIds.length === 0}
                      whileHover={selectedCourseIds.length > 0 ? { scale: 1.05 } : {}}
                      whileTap={selectedCourseIds.length > 0 ? { scale: 0.95 } : {}}
                      className={`px-5 py-2.5 rounded-md text-sm font-semibold transition-all ${selectedCourseIds.length > 0
                        ? 'bg-[#0A2540] dark:bg-[#0A2540] hover:bg-[#0d2f4d] dark:hover:bg-[#0d2f4d] text-white shadow-sm'
                        : 'bg-[#6C757D] text-gray-400 cursor-not-allowed'
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
  );
}
