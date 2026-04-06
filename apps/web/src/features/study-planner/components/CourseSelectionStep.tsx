'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, CheckCircle2, Clock, Star } from 'lucide-react';

import type { StudyPlannerAssignedCourse } from '../types/planner-ui.types';

interface CourseSelectionStepProps {
  assignedCourses: StudyPlannerAssignedCourse[];
  isVisible: boolean;
  onSelectCourse: (courseId: string) => void;
}

/**
 * Formats a date string to a human-readable Spanish date.
 */
function formatDisplayDate(dateString: string | null | undefined): string | null {
  if (!dateString) {
    return null;
  }

  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

/**
 * Returns the course with the earliest due date (suggested for planning).
 */
function getSuggestedCourseId(courses: StudyPlannerAssignedCourse[]): string | null {
  const withDueDate = courses.filter((c) => c.dueDate);
  if (withDueDate.length === 0) {
    return null;
  }

  withDueDate.sort(
    (a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
  );

  return withDueDate[0].courseId;
}

/**
 * CourseSelectionStep
 *
 * Inline component that appears in the conversation flow to let the user
 * select EXACTLY ONE course to plan. Replaces the old auto-select-all behavior.
 *
 * Requirements: RF-01, RF-03, RUX-02
 */
export function CourseSelectionStep({
  assignedCourses,
  isVisible,
  onSelectCourse,
}: CourseSelectionStepProps) {
  const suggestedCourseId = getSuggestedCourseId(assignedCourses);

  if (!isVisible || assignedCourses.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="mt-3 flex justify-start"
      >
        <div className="w-full max-w-[90%] sm:max-w-[85%]">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-[#E9ECEF] bg-white shadow-sm dark:border-[#6C757D]/30 dark:bg-[#1E2329]"
          >
            {/* Header */}
            <div className="border-b border-[#E9ECEF] bg-[#0A2540]/5 px-4 py-3 dark:border-[#6C757D]/30 dark:bg-[#0A2540]/10">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[#0A2540]/10 p-2 dark:bg-[#0A2540]/20">
                  <BookOpen className="h-4 w-4 text-[#0A2540] dark:text-[#00D4B3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0A2540] dark:text-white">
                    Tus cursos asignados
                  </h4>
                  <p className="text-[11px] text-[#6C757D] dark:text-gray-400">
                    Selecciona el curso que quieres planificar
                  </p>
                </div>
              </div>
            </div>

            {/* Course list */}
            <div className="max-h-[320px] space-y-2 overflow-y-auto px-3 py-3">
              {assignedCourses.map((course, index) => {
                const isSuggested = course.courseId === suggestedCourseId;
                const formattedDueDate = formatDisplayDate(course.dueDate);
                const formattedWindowStart = formatDisplayDate(course.planningWindowStart);
                const formattedWindowEnd = formatDisplayDate(course.planningWindowEnd);
                const hasWindow = formattedWindowStart || formattedWindowEnd;

                return (
                  <motion.button
                    key={course.courseId}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + index * 0.06 }}
                    onClick={() => onSelectCourse(course.courseId)}
                    className={`group relative w-full rounded-xl border-2 p-3.5 text-left transition-all ${
                      isSuggested
                        ? 'border-[#0A2540]/20 bg-[#0A2540]/5 dark:border-[#00D4B3]/20 dark:bg-[#0A2540]/10'
                        : 'border-[#E9ECEF] bg-white hover:border-[#0A2540]/30 hover:bg-[#0A2540]/5 dark:border-[#6C757D]/20 dark:bg-[#1E2329] dark:hover:border-[#00D4B3]/30 dark:hover:bg-[#0A2540]/10'
                    }`}
                  >
                    {/* Suggested badge */}
                    {isSuggested && (
                      <div className="absolute -top-2 right-3 flex items-center gap-1 rounded-full bg-[#0A2540] px-2 py-0.5 dark:bg-[#00D4B3]">
                        <Star className="h-2.5 w-2.5 text-white dark:text-[#0A2540]" />
                        <span className="text-[9px] font-bold uppercase tracking-wide text-white dark:text-[#0A2540]">
                          Recomendado
                        </span>
                      </div>
                    )}

                    {/* Course title */}
                    <p className="mb-1.5 pr-2 text-sm font-semibold text-[#0A2540] dark:text-white">
                      {course.title}
                    </p>

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {formattedDueDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-[#6C757D] dark:text-gray-400" />
                          <span className="text-[11px] text-[#6C757D] dark:text-gray-400">
                            Fecha límite: {formattedDueDate}
                          </span>
                        </div>
                      )}

                      {hasWindow && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-[#6C757D] dark:text-gray-400" />
                          <span className="text-[11px] text-[#6C757D] dark:text-gray-400">
                            {formattedWindowStart && formattedWindowEnd
                              ? `${formattedWindowStart} – ${formattedWindowEnd}`
                              : formattedWindowStart
                                ? `Desde ${formattedWindowStart}`
                                : `Hasta ${formattedWindowEnd}`}
                          </span>
                        </div>
                      )}

                      {!formattedDueDate && !hasWindow && (
                        <span className="text-[11px] text-[#6C757D] dark:text-gray-400">
                          Sin fecha límite
                        </span>
                      )}

                      {course.hasActivePlan && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            Plan activo
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar */}
                    {typeof course.progress === 'number' && course.progress > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E9ECEF] dark:bg-[#6C757D]/30">
                          <motion.div
                            className="h-full rounded-full bg-[#0A2540] dark:bg-[#00D4B3]"
                            initial={{ width: 0 }}
                            animate={{ width: `${course.progress}%` }}
                            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-[#0A2540] dark:text-[#00D4B3]">
                          {course.progress}%
                        </span>
                      </div>
                    )}

                    {/* CTA arrow */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6C757D] opacity-0 transition-opacity group-hover:opacity-100 dark:text-gray-400">
                      <span className="text-lg">→</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="border-t border-[#E9ECEF] px-4 py-2.5 dark:border-[#6C757D]/30">
              <p className="text-center text-[11px] text-[#6C757D] dark:text-gray-400">
                💡 Se planifica un curso a la vez. Al terminar, podrás planificar el siguiente.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
