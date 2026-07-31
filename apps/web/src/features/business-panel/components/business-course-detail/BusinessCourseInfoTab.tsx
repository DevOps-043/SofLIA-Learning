import { motion } from 'framer-motion'
import { CheckCircle, Clock, FileText, Target, Users, Video } from 'lucide-react'

import type { BusinessCourseDetail } from '../../types/business-course-detail.types'
import styles from './BusinessCourseDetail.module.css'

interface BusinessCourseInfoTabProps {
  course: BusinessCourseDetail
  textColor: string
  borderColor: string
  primaryColor: string
  accentColor: string
  isDark: boolean
  formatDuration: (minutes: number | null) => string
}

export function BusinessCourseInfoTab({
  course,
  formatDuration,
}: BusinessCourseInfoTabProps) {
  const metrics = [
    { icon: FileText, label: 'Módulos', value: course.stats.total_modules },
    { icon: Video, label: 'Lecciones', value: course.stats.total_lessons },
    { icon: Clock, label: 'Duración', value: formatDuration(course.stats.total_duration_minutes) },
    { icon: Users, label: 'Estudiantes', value: course.student_count.toLocaleString() },
  ]

  return (
    <motion.div
      key="info"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={styles.contentSection}
    >
      <header className={styles.overviewLead}>
        <span>Resumen académico</span>
        <h3>Información clave del curso</h3>
        <p>Consulta la estructura, duración y alcance antes de asignarlo a tu equipo.</p>
      </header>

      {course.learning_objectives.length > 0 ? (
        <section className={styles.contentSection}>
          <header className={styles.sectionHeading}>
            <h3>
              <Target aria-hidden="true" />
              Lo que aprenderás
            </h3>
          </header>
          <div className={styles.objectiveGrid}>
            {course.learning_objectives.map((objective, index) => (
              <motion.div
                key={objective}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={styles.objective}
              >
                <CheckCircle aria-hidden="true" />
                <span>{objective}</span>
              </motion.div>
            ))}
          </div>
        </section>
      ) : null}

      <div className={styles.metricGrid}>
        {metrics.map(({ icon: Icon, label, value }, index) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={styles.metric}
          >
            <span className={styles.metricLabel}>
              <span className={styles.metricIcon}><Icon aria-hidden="true" /></span>
              {label}
            </span>
            <strong>{value}</strong>
          </motion.div>
        ))}
      </div>

      {course.description ? (
        <section className={styles.description}>
          <h3>Descripción del curso</h3>
          <p className="whitespace-pre-line">{course.description}</p>
        </section>
      ) : null}
    </motion.div>
  )
}
