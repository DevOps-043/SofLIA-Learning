'use client'

import { motion } from 'framer-motion'
import { Clock3, Play, Star, UserRound, Video } from 'lucide-react'

import type {
  BusinessCourseDetail,
  BusinessCourseLevelStyles,
} from '../../types/business-course-detail.types'
import styles from './BusinessCourseDetail.module.css'

interface BusinessCourseDetailHeroProps {
  course: BusinessCourseDetail
  levelStyles: BusinessCourseLevelStyles
  primaryColor: string
  accentColor: string
  textColor: string
  mutedTextColor: string
  borderColor: string
  formatDuration: (minutes: number | null) => string
}

export function BusinessCourseDetailHero({
  course,
  levelStyles,
  formatDuration,
}: BusinessCourseDetailHeroProps) {
  return (
    <section className={styles.hero} aria-labelledby="course-detail-title">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.heroMedia}
      >
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} />
        ) : (
          <div className={styles.heroFallback}>
            <span><Video aria-hidden="true" /></span>
          </div>
        )}
        <div className={styles.heroMediaOverlay} aria-hidden="true">
          <span className={styles.heroMediaBadge}>
            <Play />
            Vista previa
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        className={styles.heroCopy}
      >
        <p className={styles.heroEyebrow}>
          <span aria-hidden="true" />
          Programa de formación
        </p>

        <div className={styles.heroBadges}>
          <span className={styles.heroBadge}>{course.category || 'Curso'}</span>
          <span
            className={styles.heroBadge}
            style={{
              color: levelStyles.color,
              borderColor: `color-mix(in srgb, ${levelStyles.color} 26%, var(--detail-border))`,
              backgroundColor: levelStyles.bg,
            }}
          >
            {levelStyles.text}
          </span>
        </div>

        <h1 id="course-detail-title" className={styles.heroTitle}>{course.title}</h1>

        <div className={styles.heroInstructor}>
          <span className={styles.heroInstructorIcon} aria-hidden="true">
            {course.instructor?.profile_picture_url ? (
              <img src={course.instructor.profile_picture_url} alt="" />
            ) : (
              <UserRound />
            )}
          </span>
          <span className={styles.heroInstructorCopy}>
            <small>Impartido por</small>
            <strong>{course.instructor?.name || 'Equipo SofLIA'}</strong>
          </span>
        </div>

        <div className={styles.heroStats} aria-label="Resumen del curso">
          <span className={styles.heroStat}>
            <span className={styles.heroStatIcon}><Star aria-hidden="true" /></span>
            <span className={styles.heroStatCopy}>
              <small>Valoración</small>
              <strong>{course.rating.toFixed(1)} <span>· {course.review_count} reseñas</span></strong>
            </span>
          </span>
          <span className={styles.heroStat}>
            <span className={styles.heroStatIcon}><Clock3 aria-hidden="true" /></span>
            <span className={styles.heroStatCopy}>
              <small>Duración</small>
              <strong>{formatDuration(course.stats.total_duration_minutes)}</strong>
            </span>
          </span>
          <span className={styles.heroStat}>
            <span className={styles.heroStatIcon}><Video aria-hidden="true" /></span>
            <span className={styles.heroStatCopy}>
              <small>Contenido</small>
              <strong>{course.stats.total_lessons} lecciones</strong>
            </span>
          </span>
        </div>
      </motion.div>
    </section>
  )
}
