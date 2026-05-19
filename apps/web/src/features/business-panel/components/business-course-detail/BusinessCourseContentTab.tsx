import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronDown, Play } from 'lucide-react'
import type { BusinessCourseDetail } from '../../types/business-course-detail.types'

interface BusinessCourseContentTabProps {
  course: BusinessCourseDetail
  expandedModules: Set<string>
  toggleModule: (moduleId: string) => void
  textColor: string
  mutedTextColor: string
  borderColor: string
  primaryColor: string
  onPrimaryColor: string
  formatDuration: (minutes: number | null) => string
  formatDurationSeconds: (seconds: number) => string
}

export function BusinessCourseContentTab({
  course,
  expandedModules,
  toggleModule,
  textColor,
  mutedTextColor,
  borderColor,
  primaryColor,
  onPrimaryColor,
  formatDuration,
  formatDurationSeconds
}: BusinessCourseContentTabProps) {
  return (
    <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold" style={{ color: textColor }}>Contenido del Curso</h3>
          <span className="text-sm" style={{ color: mutedTextColor }}>
            {course.stats.total_modules} modulos • {course.stats.total_lessons} lecciones
          </span>
        </div>

        {course.modules.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 3.1%, transparent)`, borderColor }}>
            <BookOpen className="w-16 h-16 mx-auto mb-4" style={{ color: mutedTextColor }} />
            <p style={{ color: mutedTextColor }}>Este curso aun no tiene contenido disponible</p>
          </div>
        ) : (
          <div className="space-y-3">
            {course.modules.map((module, moduleIndex) => {
              const isExpanded = expandedModules.has(module.module_id)
              const moduleDurationMinutes =
                module.calculated_duration_minutes ||
                module.module_duration_minutes ||
                Math.round(module.lessons.reduce((sum, lesson) => sum + lesson.duration_seconds, 0) / 60)

              return (
                <motion.div
                  key={module.module_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: moduleIndex * 0.05 }}
                  className="rounded-xl border overflow-hidden"
                  style={{ backgroundColor: isExpanded ? `color-mix(in srgb, ${primaryColor} 3.1%, transparent)` : 'transparent', borderColor }}
                >
                  <button
                    onClick={() => toggleModule(module.module_id)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:opacity-80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: isExpanded ? primaryColor : `color-mix(in srgb, ${primaryColor} 9.4%, transparent)`,
                          color: isExpanded ? onPrimaryColor : primaryColor
                        }}
                      >
                        {moduleIndex + 1}
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold" style={{ color: textColor }}>{module.module_title}</h4>
                        <p className="text-sm" style={{ color: mutedTextColor }}>
                          {module.lessons.length} lecciones • {formatDuration(moduleDurationMinutes)}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} style={{ color: mutedTextColor }} />
                  </button>

                  <AnimatePresence>
                    {isExpanded ? (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 space-y-2">
                          {module.lessons.map((lesson, lessonIndex) => (
                            <div key={lesson.lesson_id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 12.5%, transparent)` }}>
                                <Play className="w-4 h-4" style={{ color: onPrimaryColor, strokeWidth: 3 }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium" style={{ color: textColor }}>
                                  {lessonIndex + 1}. {lesson.lesson_title}
                                </p>
                              </div>
                              <span className="text-xs" style={{ color: mutedTextColor }}>
                                {formatDurationSeconds(lesson.duration_seconds)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
