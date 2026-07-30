'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import { ArrowUpRight, Award, Play, BookOpen, CheckCircle2, Lock } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import { formatShortDate, formatDate } from '../../../../../shared/utils/date-formatter'
import type { StyleConfig } from '../../../../../features/business-panel/contexts/OrganizationStylesContext'
import dashboardStyles from '../page-components/BusinessUserDashboard.module.css'

interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'No iniciado' | 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
}

interface CourseCard3DProps {
  course: AssignedCourse
  index: number
  onClick: () => void
  onCertificateClick?: () => void
  onPreview?: (anchor: HTMLElement) => void
  onPreviewEnd?: () => void
  styles?: Partial<StyleConfig> | null
  viewMode?: 'grid' | 'list'
  learningPathTitle?: string
  learningPathPosition?: number
  isLockedInPath?: boolean
  disableHeavyEffects?: boolean
}

/**
 * CourseCard3D - Simplified course card without heavy 3D animations
 * Uses CSS transitions for hover effects instead of Framer Motion
 */
export function CourseCard3D({
  course,
  index,
  onClick,
  onCertificateClick,
  onPreview,
  onPreviewEnd,
  styles,
  viewMode = 'grid',
  learningPathTitle,
  learningPathPosition,
  isLockedInPath = false,
  disableHeavyEffects = false,
}: CourseCard3DProps) {
  const { t, i18n } = useTranslation('business')
  const { resolvedTheme } = useThemeStore()
  const isSystemLight = resolvedTheme === 'light'

  const primaryColor = styles?.primary_button_color || 'var(--color-primary)'
  const accentColor = styles?.accent_color || primaryColor

  // Defaults adaptativos basados en el tema del sistema
  const defaultCardBg = isSystemLight ? 'var(--color-bg-light)' : 'var(--color-gray-800)'
  const defaultText = isSystemLight ? 'var(--color-legacy-0f172a)' : 'var(--color-bg-light)'
  const defaultBorder = isSystemLight ? 'var(--color-gray-200)' : 'var(--color-legacy-334155)'

  const cardBackground = styles?.card_background || defaultCardBg
  const textColor = styles?.text_color || defaultText
  const borderColor = styles?.border_color || defaultBorder
  const cardOpacity = styles?.card_opacity ?? 0.95

  const isLightMode = isSystemLight

  const statusKeyMap: Record<string, string> = {
    'No iniciado': 'dashboard.courses.status.notStarted',
    'Asignado': 'dashboard.courses.status.assigned',
    'En progreso': 'dashboard.courses.status.inProgress',
    'Completado': 'dashboard.courses.status.completed'
  }

  const displayStatus: AssignedCourse['status'] =
    course.progress <= 0 && course.status !== 'Completado' ? 'No iniciado' : course.status
  const translatedStatus = t(statusKeyMap[displayStatus] || displayStatus, displayStatus)

  const getStatusBadgeStyle = (): CSSProperties => {
    switch (displayStatus) {
      case 'Completado':
        return {
          backgroundColor: 'color-mix(in srgb, var(--color-success) 16%, transparent)',
          borderColor: 'color-mix(in srgb, var(--color-success) 42%, transparent)',
          color: 'var(--color-success)',
        }
      case 'En progreso':
        return {
          backgroundColor: `color-mix(in srgb, ${accentColor} 16%, transparent)`,
          borderColor: `color-mix(in srgb, ${accentColor} 42%, transparent)`,
          color: accentColor,
        }
      default:
        return {
          backgroundColor: `color-mix(in srgb, ${isLightMode ? 'var(--color-gray-500)' : 'var(--color-gray-200)'} 12%, transparent)`,
          borderColor: `color-mix(in srgb, ${isLightMode ? 'var(--color-gray-500)' : 'var(--color-gray-200)'} 28%, transparent)`,
          color: isLightMode ? 'var(--color-gray-500)' : 'var(--color-gray-200)',
        }
    }
  }

  const getStatusIcon = () => {
    switch (displayStatus) {
      case 'Completado':
        return <CheckCircle2 className="w-4 h-4" />
      case 'En progreso':
        return <Play className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  if (viewMode === 'list') {
    return (
      <article
        data-tour-id="business-user-dashboard--course-card"
        className={`${dashboardStyles.listCourseCard} group ${isLockedInPath ? dashboardStyles.listCourseCardLocked : ''}`}
        style={{
          '--dashboard-primary': primaryColor,
          '--dashboard-accent': accentColor,
          '--dashboard-text': textColor,
          '--dashboard-muted': isLightMode
            ? 'var(--color-gray-500)'
            : 'var(--color-legacy-9ca3af)',
          '--dashboard-surface': cardBackground,
          '--dashboard-border': borderColor,
          '--list-card-opacity': cardOpacity,
          animationDelay: `${index * 40}ms`,
        } as CSSProperties}
      >
        {!isLockedInPath ? (
          <button
            type="button"
            className={dashboardStyles.listCourseClickTarget}
            onClick={onClick}
            aria-label={`${translatedStatus}: ${course.title}`}
          />
        ) : null}
        {/* Path position badge */}
        <div
          className={dashboardStyles.listCoursePositionLane}
          style={{ color: isLockedInPath ? (isLightMode ? 'var(--color-gray-400)' : 'var(--color-legacy-6b7280)') : accentColor }}
        >
          {isLockedInPath ? <Lock className="w-3.5 h-3.5" /> : learningPathPosition !== undefined ? `#${learningPathPosition}` : null}
        </div>

        {/* Thumbnail — small square, fixed 64×64 */}
        <div
          className={dashboardStyles.listCourseMedia}
        >
          <Image
            src={course.thumbnail || '/images/course-placeholder.png'}
            alt={course.title}
            fill
            priority={index < 6}
            className={dashboardStyles.listCourseImage}
            sizes="(max-width: 768px) 40vw, 220px"
          />
          <span className={dashboardStyles.listCourseMediaShade} />
          {isLockedInPath || learningPathPosition !== undefined ? (
            <span className={dashboardStyles.listCoursePosition}>
              {isLockedInPath ? (
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                learningPathPosition
              )}
            </span>
          ) : null}
        </div>

        {/* Title + instructor — takes all available space */}
        <div className={dashboardStyles.listCourseContent}>
          {learningPathTitle ? (
            <span className={dashboardStyles.listCoursePath}>{learningPathTitle}</span>
          ) : null}
          <h3 className={dashboardStyles.listCourseTitle}>
            {course.title}
          </h3>
          <p className={dashboardStyles.listCourseInstructor}>
            {course.instructor}
          </p>
          <div className={dashboardStyles.listCourseMobileMeta}>
            <span
              className={dashboardStyles.listCourseMobileStatus}
              style={getStatusBadgeStyle()}
            >
              {getStatusIcon()}
              <span>{translatedStatus}</span>
            </span>
            <span className={dashboardStyles.listCourseMobileProgress}>
              {course.progress}%
            </span>
          </div>
        </div>

        {/* Status badge — only on md+ */}
        <div
          className={dashboardStyles.listCourseStatus}
          style={getStatusBadgeStyle()}
        >
          {getStatusIcon()}
          <span>{translatedStatus}</span>
        </div>

        {/* Progress column */}
        <div className={dashboardStyles.listCourseProgress}>
          <span className={dashboardStyles.listCourseProgressValue}>
            {course.progress}%
          </span>
          <div className={dashboardStyles.listCourseProgressTrack}>
            <div
              className={dashboardStyles.listCourseProgressBar}
              style={{ width: `${course.progress}%`, background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
            />
          </div>
          {course.due_date && (
            <span className={dashboardStyles.listCourseDueDate}>
              {formatDate(course.due_date, i18n.language, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {course.has_certificate && course.progress === 100 && onCertificateClick ? (
          <button
            type="button"
            data-tour-id="business-user-dashboard--certificate-action"
            onClick={onCertificateClick}
            className={dashboardStyles.listCourseCertificate}
            aria-label={t('dashboard.courses.viewCertificate', 'Ver certificado')}
          >
            <Award className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <span className={dashboardStyles.listCourseArrow}>
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </article>
    )
  }

  const courseActionLabel =
    displayStatus === 'Completado'
      ? t('dashboard.courses.review', 'Ver curso')
      : course.progress > 0
        ? t('dashboard.courses.continue', 'Continuar')
        : t('dashboard.courses.start', 'Comenzar')

  return (
    <motion.article
      data-tour-id="business-user-dashboard--course-card"
      initial={disableHeavyEffects ? false : { opacity: 0, y: 22 }}
      whileInView={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.14 }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.045, 0.18),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`${dashboardStyles.courseCard} group ${isLockedInPath ? dashboardStyles.courseCardLocked : ''}`}
      onMouseEnter={(event) => {
        if (!isLockedInPath) onPreview?.(event.currentTarget)
      }}
      onMouseLeave={onPreviewEnd}
      onFocusCapture={(event) => {
        if (!isLockedInPath) onPreview?.(event.currentTarget)
      }}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null
        if (!nextTarget || !event.currentTarget.contains(nextTarget)) onPreviewEnd?.()
      }}
      style={{
        '--dashboard-primary': primaryColor,
        '--dashboard-accent': accentColor,
        '--dashboard-text': textColor,
        '--dashboard-muted': isLightMode
          ? 'var(--color-gray-500)'
          : 'var(--color-legacy-9ca3af)',
        '--dashboard-surface': cardBackground,
        '--dashboard-border': borderColor,
        animationDelay: `${index * 50}ms`,
      } as CSSProperties}
    >
      {!isLockedInPath ? (
        <button
          type="button"
          className={dashboardStyles.courseClickTarget}
          onClick={onClick}
          aria-label={`${courseActionLabel}: ${course.title}`}
        />
      ) : null}

      <div className={dashboardStyles.courseMedia}>
        <Image
          src={course.thumbnail || '/images/course-placeholder.png'}
          alt={course.title}
          fill
          priority={index < 4}
          className={dashboardStyles.courseImage}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        <div className={dashboardStyles.courseMediaShade} />

        {isLockedInPath ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <Lock className="h-7 w-7 text-white/80" />
          </div>
        ) : (
          <div className={dashboardStyles.courseStatus}>
            {getStatusIcon()}
            {translatedStatus}
          </div>
        )}

        {course.has_certificate && course.progress === 100 && onCertificateClick ? (
          <button
            type="button"
            data-tour-id="business-user-dashboard--certificate-action"
            onClick={(event) => {
              event.stopPropagation()
              onCertificateClick()
            }}
            className={dashboardStyles.certificateButton}
            aria-label={t('dashboard.courses.openCertificate', 'Abrir certificado')}
          >
            <Award className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className={dashboardStyles.courseContent}>
        {learningPathTitle ? (
          <p className={dashboardStyles.coursePath}>
            <span>#{learningPathPosition}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{learningPathTitle}</span>
          </p>
        ) : null}
        <h3
          id={`dashboard-course-${course.id}`}
          className={dashboardStyles.courseTitle}
        >
          {course.title}
        </h3>
        <p className={dashboardStyles.courseInstructor}>{course.instructor}</p>

        <div className={dashboardStyles.courseFooter}>
          <div className={dashboardStyles.courseProgressMeta}>
            <span>{t('dashboard.courses.progress', 'Progreso')}</span>
            <span className={dashboardStyles.courseProgressValue}>{course.progress}%</span>
          </div>
          <div className={dashboardStyles.courseProgressTrack}>
            <div
              className={dashboardStyles.courseProgressBar}
              style={{ width: `${course.progress}%` }}
            />
          </div>
          <div className={dashboardStyles.courseBottomLine}>
            {course.due_date ? (
              <p className={dashboardStyles.courseDueDate}>
                {t('dashboard.courses.dueDatePrefix', 'Vence:')}{' '}
                {formatShortDate(course.due_date, i18n.language)}
              </p>
            ) : null}
            {!isLockedInPath ? (
              <span className={dashboardStyles.courseCta}>
                {courseActionLabel}
                <ArrowUpRight className={`${dashboardStyles.courseCtaIcon} h-3.5 w-3.5`} />
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
