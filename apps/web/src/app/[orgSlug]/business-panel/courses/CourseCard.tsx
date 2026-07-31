'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  ArrowUpRight,
  BookOpen,
  Star,
  Users,
  Clock,
} from 'lucide-react'
import { type BusinessCourse } from '@/features/business-panel/hooks/useBusinessCourses'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useTranslation } from 'react-i18next'
import { useMotionSafe } from '@/lib/utils/motion'
import styles from './ContentPanel.module.css'

export interface CourseCardProps {
  course: BusinessCourse
  index: number
  onClick?: () => void
}

type TranslateFn = (key: string) => string

function formatDuration(minutes: number | null): string {
  if (!minutes) return 'N/A'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

function getLevelStyles(
  level: string | null,
  translate: TranslateFn,
  difficultyColors: {
    beginner: string
    intermediate: string
    advanced: string
    default: string
  }
) {
  switch (level?.toLowerCase()) {
    case 'beginner':
    case 'principiante':
      return { bg: `color-mix(in srgb, ${difficultyColors.beginner} 12.5%, transparent)`, color: difficultyColors.beginner, text: translate('courses.levels.beginner') }
    case 'intermediate':
    case 'intermedio':
      return { bg: `color-mix(in srgb, ${difficultyColors.intermediate} 12.5%, transparent)`, color: difficultyColors.intermediate, text: translate('courses.levels.intermediate') }
    case 'advanced':
    case 'avanzado':
      return { bg: `color-mix(in srgb, ${difficultyColors.advanced} 12.5%, transparent)`, color: difficultyColors.advanced, text: translate('courses.levels.advanced') }
    default:
      return { bg: `color-mix(in srgb, ${difficultyColors.default} 12.5%, transparent)`, color: difficultyColors.default, text: level || 'N/A' }
  }
}

export function CourseCard({ course, index, onClick }: CourseCardProps) {
  const { t } = useTranslation('business')
  const { disableHeavy, interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  const {
    difficultyColors,
  } = useBusinessPanelTheme()
  const levelStyles = getLevelStyles(course.level, t, difficultyColors)
  const entranceDelay = disableHeavy ? 0 : Math.min(index * interfaceStaggerSeconds, 0.08)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...interfaceTransition, delay: entranceDelay }}
      onClick={onClick}
      className={styles.courseCard}
    >
      <div className={styles.courseMedia}>
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            priority={index < 4}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          />
        ) : (
          <div className={styles.courseFallback}>
            <BookOpen aria-hidden="true" />
          </div>
        )}

        <span
          className={styles.courseBadge}
          style={{
            backgroundColor: levelStyles.bg,
            color: levelStyles.color,
            borderColor: `color-mix(in srgb, ${levelStyles.color} 28%, transparent)`,
          }}
        >
          {levelStyles.text}
        </span>

        <span className={styles.courseRating} aria-label={`Valoración ${course.rating?.toFixed(1) ?? '0.0'}`}>
          <Star aria-hidden="true" />
          {course.rating ? course.rating.toFixed(1) : '0.0'}
        </span>

        <div className={styles.courseOpenHint} aria-hidden="true">
          <span>
            Ver curso
            <ArrowUpRight />
          </span>
        </div>
      </div>

      <div className={styles.courseBody}>
        <p className={styles.courseCategory}>{course.category || 'Curso'}</p>
        <h3 className={styles.courseTitle}>{course.title}</h3>
        <p className={styles.courseInstructor}>{course.instructor.name}</p>

        <div className={styles.courseMeta}>
          <span className={styles.courseMetaItem}>
            <Clock aria-hidden="true" />
            {formatDuration(course.duration)}
          </span>
          <span className={styles.courseMetaItem}>
            <Users aria-hidden="true" />
            {course.student_count || 0} estudiantes
          </span>
        </div>
      </div>
    </motion.div>
  )
}
