'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { formatCourseDuration, formatLessonDuration } from '../../services/course-detail-display.service'
import type { CourseDetailModule, CourseDetailSummary } from '../../types/course-detail.types'

interface CourseDetailContentTabProps {
  modules: CourseDetailModule[]
  summary: CourseDetailSummary
  expandedModules: Set<string>
  onToggleModule: (moduleId: string) => void
}

export function CourseDetailContentTab({
  modules,
  summary,
  expandedModules,
  onToggleModule,
}: CourseDetailContentTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Contenido del Curso</h3>
        <span className="text-gray-600 dark:text-slate-300 text-sm">
          {summary.totalModules} modulos • {summary.totalLessons} lecciones • {formatCourseDuration(summary.totalDurationMinutes)}
        </span>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-300">Este curso aun no tiene contenido disponible</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(module.module_id)
            const moduleDurationSeconds = module.module_duration_minutes
              ? module.module_duration_minutes * 60
              : module.lessons.reduce((sum, lesson) => sum + (lesson.duration_seconds || 0), 0)

            return (
              <div key={module.module_id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-none">
                <button
                  onClick={() => onToggleModule(module.module_id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1 text-left">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${isExpanded ? 'bg-primary' : 'bg-gray-400 dark:bg-slate-600'}`}>
                      {moduleIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 dark:text-white font-semibold mb-1">{module.module_title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-slate-300">
                        <span>{module.lessons.length} {module.lessons.length === 1 ? 'leccion' : 'lecciones'}</span>
                        <span>{formatLessonDuration(moduleDurationSeconds)}</span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-600 dark:text-slate-300" /> : <ChevronDown className="w-5 h-5 text-gray-600 dark:text-slate-300" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-4 space-y-2 border-t border-gray-200 dark:border-slate-700 pt-4">
                        {module.module_description && (
                          <p className="text-gray-600 dark:text-slate-300 text-sm mb-4">{module.module_description}</p>
                        )}
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div key={lesson.lesson_id} className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border border-gray-200 dark:border-slate-600">
                            <Play className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" style={{ strokeWidth: 2.5 }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 dark:text-white text-sm font-medium">
                                {lessonIndex + 1}. {lesson.lesson_title}
                              </p>
                              {lesson.lesson_description && (
                                <p className="text-gray-600 dark:text-slate-300 text-xs mt-1 line-clamp-1">{lesson.lesson_description}</p>
                              )}
                            </div>
                            <span className="text-gray-500 dark:text-slate-400 text-xs flex-shrink-0">
                              {formatLessonDuration(lesson.duration_seconds || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
