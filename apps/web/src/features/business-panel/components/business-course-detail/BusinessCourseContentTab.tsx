import { AnimatePresence, motion } from 'framer-motion'
import { BookOpen, ChevronDown, Play } from 'lucide-react'

import type { BusinessCourseDetail } from '../../types/business-course-detail.types'
import styles from './BusinessCourseDetail.module.css'

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
  formatDuration,
  formatDurationSeconds,
}: BusinessCourseContentTabProps) {
  return (
    <motion.div
      key="content"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={styles.contentSection}
    >
      <header className={styles.contentHeader}>
        <h3>Contenido del curso</h3>
        <span>{course.stats.total_modules} módulos · {course.stats.total_lessons} lecciones</span>
      </header>

      {course.modules.length === 0 ? (
        <div className={styles.emptyState}>
          <div>
            <span className={styles.emptyStateIcon} aria-hidden="true">
              <BookOpen />
            </span>
            <h4>Contenido en preparación</h4>
            <p>Este curso aún no tiene módulos publicados. Cuando estén disponibles aparecerán aquí.</p>
          </div>
        </div>
      ) : (
        <div className={styles.moduleList}>
          {course.modules.map((module, moduleIndex) => {
            const isExpanded = expandedModules.has(module.module_id)
            const moduleDurationMinutes =
              module.calculated_duration_minutes
              || module.module_duration_minutes
              || Math.round(module.lessons.reduce((sum, lesson) => sum + lesson.duration_seconds, 0) / 60)

            return (
              <motion.section
                key={module.module_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: moduleIndex * 0.04 }}
                className={`${styles.module} ${isExpanded ? styles.moduleOpen : ''}`}
              >
                <button
                  type="button"
                  onClick={() => toggleModule(module.module_id)}
                  className={styles.moduleTrigger}
                  aria-expanded={isExpanded}
                  aria-controls={`course-module-${module.module_id}`}
                >
                  <span className={styles.moduleIndex}>{moduleIndex + 1}</span>
                  <span className={styles.moduleIdentity}>
                    <strong>{module.module_title}</strong>
                    <small>{module.lessons.length} lecciones · {formatDuration(moduleDurationMinutes)}</small>
                  </span>
                  <ChevronDown
                    className={`${styles.moduleChevron} ${isExpanded ? styles.moduleChevronOpen : ''}`}
                    aria-hidden="true"
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded ? (
                    <motion.div
                      id={`course-module-${module.module_id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={styles.lessons}
                    >
                      {module.lessons.map((lesson, lessonIndex) => (
                        <div key={lesson.lesson_id} className={styles.lesson}>
                          <span className={styles.lessonIcon} aria-hidden="true">
                            <Play />
                          </span>
                          <p>{lessonIndex + 1}. {lesson.lesson_title}</p>
                          <time>{formatDurationSeconds(lesson.duration_seconds)}</time>
                        </div>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.section>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
