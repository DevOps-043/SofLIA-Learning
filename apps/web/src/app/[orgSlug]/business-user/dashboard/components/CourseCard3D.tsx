'use client'

import type { CSSProperties } from 'react'
import Image from 'next/image'
import { Award, Play, BookOpen, CheckCircle2, Lock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { hexToRgb } from '../../../../../features/business-panel/utils/styles'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import { formatShortDate, formatDate } from '../../../../../shared/utils/date-formatter'
import type { StyleConfig } from '../../../../../features/business-panel/contexts/OrganizationStylesContext'

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
  const accentColor = styles?.accent_color || 'var(--color-accent)'

  // Defaults adaptativos basados en el tema del sistema
  const defaultCardBg = isSystemLight ? 'var(--color-bg-light)' : 'var(--color-gray-800)'
  const defaultText = isSystemLight ? 'var(--color-legacy-0f172a)' : 'var(--color-bg-light)'
  const defaultBorder = isSystemLight ? 'var(--color-gray-200)' : 'var(--color-legacy-334155)'

  const cardBackground = styles?.card_background || defaultCardBg
  const textColor = styles?.text_color || defaultText
  const borderColor = styles?.border_color || defaultBorder
  const cardOpacity = styles?.card_opacity ?? 0.95

  // Determinar si estamos en modo claro basándonos en el color de fondo
  const isLightMode = cardBackground.toLowerCase() === 'var(--color-bg-light)' ||
                      cardBackground.toLowerCase() === 'var(--color-gray-50)' ||
                      cardBackground.startsWith('rgb(255') ||
                      cardBackground.startsWith('rgba(255')

  // Calcular RGB para opacidad
  const cardBgRgb = hexToRgb(cardBackground)

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
      <div
        className={`group grid grid-cols-[2.5rem_4rem_minmax(0,1fr)] items-center overflow-hidden rounded-2xl md:grid-cols-[2.5rem_4rem_minmax(0,1fr)_9rem_7.5rem_2.75rem] ${disableHeavyEffects ? '' : 'transition-all duration-200'} ${isLockedInPath ? 'cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
        style={{
          backgroundColor: `rgba(${cardBgRgb}, ${cardOpacity})`,
          border: `1px solid ${isLightMode ? borderColor : 'rgba(255,255,255,0.07)'}`,
          animationDelay: `${index * 40}ms`,
          opacity: isLockedInPath ? 0.5 : 1,
        }}
        onClick={isLockedInPath ? undefined : onClick}
      >
        {/* Path position badge */}
        <div
          className="flex min-h-16 items-center justify-center text-xs font-bold"
          style={{ color: isLockedInPath ? (isLightMode ? 'var(--color-gray-400)' : 'var(--color-legacy-6b7280)') : accentColor }}
        >
          {isLockedInPath ? <Lock className="w-3.5 h-3.5" /> : learningPathPosition !== undefined ? `#${learningPathPosition}` : null}
        </div>

        {/* Thumbnail — small square, fixed 64×64 */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ width: 64, minWidth: 64, height: 64, backgroundColor: isLightMode ? 'var(--color-gray-100)' : 'var(--color-legacy-0f172a)' }}
        >
          <Image
            src={course.thumbnail || '/images/course-placeholder.png'}
            alt={course.title}
            fill
            className={`object-cover ${disableHeavyEffects ? '' : 'transition-transform duration-500 group-hover:scale-105'}`}
            sizes="64px"
          />
        </div>

        {/* Title + instructor — takes all available space */}
        <div className="flex-1 min-w-0 px-4 py-3">
          <h3
            className="text-sm font-semibold leading-snug line-clamp-2 group-hover:opacity-75 transition-opacity"
            style={{ color: textColor }}
          >
            {course.title}
          </h3>
          <p className="text-[11px] mt-0.5 truncate" style={{ color: isLightMode ? 'var(--color-gray-500)' : 'var(--color-legacy-9ca3af)' }}>
            {course.instructor}
          </p>
          <div className="mt-2 flex items-center gap-2 md:hidden">
            <span
              className="inline-flex h-7 min-w-[7.5rem] items-center justify-center gap-1.5 rounded-full border px-2 text-[9px] font-bold uppercase tracking-wide"
              style={getStatusBadgeStyle()}
            >
              {getStatusIcon()}
              <span>{translatedStatus}</span>
            </span>
            <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>
              {course.progress}%
            </span>
          </div>
        </div>

        {/* Status badge — only on md+ */}
        <div
          className="mx-3 hidden h-8 min-w-[8.25rem] items-center justify-center gap-1.5 rounded-full border px-3 text-[10px] font-bold uppercase tracking-wide md:flex"
          style={getStatusBadgeStyle()}
        >
          {getStatusIcon()}
          <span>{translatedStatus}</span>
        </div>

        {/* Progress column */}
        <div className="hidden shrink-0 flex-col items-end gap-1 pr-4 py-3 md:flex">
          <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>
            {course.progress}%
          </span>
          <div
            className="h-1.5 w-20 rounded-full overflow-hidden"
            style={{ backgroundColor: isLightMode ? 'var(--color-gray-200)' : 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${course.progress}%`, background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
            />
          </div>
          {course.due_date && (
            <span className="text-[9px] mt-0.5" style={{ color: isLightMode ? 'var(--color-gray-400)' : 'var(--color-legacy-6b7280)' }}>
              {formatDate(course.due_date, i18n.language, { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Certificate icon */}
        <div className="hidden items-center justify-center md:flex">
          {course.has_certificate && course.progress === 100 && onCertificateClick ? (
            <button
              onClick={(e) => { e.stopPropagation(); onCertificateClick() }}
              className="p-2 rounded-full transition-all duration-200 hover:scale-110"
              style={{ color: 'var(--color-warning)', backgroundColor: isLightMode ? 'var(--color-legacy-fef3c7)' : 'rgba(245,158,11,0.15)' }}
            >
              <Award className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-[20px] ${disableHeavyEffects ? '' : 'transition-all duration-300'} ${isLockedInPath ? 'cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl cursor-pointer'}`}
      style={{
        backgroundColor: `rgba(${cardBgRgb}, ${cardOpacity})`,
        border: `1px solid ${isLightMode ? borderColor : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isLightMode ? '0 4px 20px -10px rgba(0,0,0,0.08)' : 'none',
        animationDelay: `${index * 50}ms`,
        opacity: isLockedInPath ? 0.5 : 1,
      }}
      onClick={isLockedInPath ? undefined : onClick}
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video w-full overflow-hidden"
        style={{ backgroundColor: isLightMode ? 'var(--color-gray-50)' : 'var(--color-legacy-0f172a)' }}
      >
        <Image
          src={course.thumbnail || '/images/course-placeholder.png'}
          alt={course.title}
          fill
          className={`object-cover ${disableHeavyEffects ? '' : 'transition-transform duration-700 ease-out group-hover:scale-105'}`}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {isLockedInPath ? (
          <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-white/80" />
          </div>
        ) : (
          <div className={`absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase text-white bg-black/40 border border-white/20 ${disableHeavyEffects ? '' : 'backdrop-blur-md'}`}>
            {getStatusIcon()}
            {translatedStatus}
          </div>
        )}

        {course.has_certificate && course.progress === 100 && onCertificateClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onCertificateClick() }}
            className={`absolute top-3 right-3 p-2 rounded-full bg-white/20 border border-white/40 text-yellow-400 shadow-sm ${disableHeavyEffects ? '' : 'backdrop-blur-md transition-all duration-300 hover:scale-110 hover:bg-white hover:text-yellow-600'}`}
          >
            <Award className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5">
        <h3
          className="text-sm font-bold leading-snug mb-1 transition-colors group-hover:opacity-80"
          style={{ color: textColor }}
        >
          {course.title}
        </h3>
        <p className="text-[10px] mb-1 line-clamp-1" style={{ color: isLightMode ? 'var(--color-gray-500)' : 'var(--color-legacy-9ca3af)' }}>
          {course.instructor}
        </p>
        {learningPathTitle && (
          <p className="text-[9px] mb-2 flex items-center gap-1 truncate font-medium" style={{ color: accentColor + 'bb' }}>
            <span className="font-bold">#{learningPathPosition}</span>
            <span>·</span>
            <span className="truncate">{learningPathTitle}</span>
          </p>
        )}

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: isLightMode ? 'var(--color-gray-400)' : 'var(--color-legacy-858e9b)' }}>
              {t('dashboard.courses.progress', 'Progreso')}
            </span>
            <span className="text-[10px] font-bold" style={{ color: accentColor }}>
              {course.progress}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: isLightMode ? 'var(--color-gray-100)' : 'rgba(255,255,255,0.08)' }}>
            <div
              className={`h-full rounded-full ${disableHeavyEffects ? '' : 'transition-all duration-700 ease-out'}`}
              style={{ width: `${course.progress}%`, background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
            />
          </div>
          <div className="h-[14px] mt-2">
            {course.due_date && (
              <p className="text-[9px] font-medium" style={{ color: isLightMode ? 'var(--color-gray-400)' : 'var(--color-legacy-858e9b)' }}>
                {t('dashboard.courses.dueDatePrefix', 'Vence:')} {formatShortDate(course.due_date, i18n.language)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
