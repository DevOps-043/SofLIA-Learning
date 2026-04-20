'use client'

import Image from 'next/image'
import { Award, Play, BookOpen, CheckCircle2, Lock } from 'lucide-react'
import { hexToRgb } from '../../../../../features/business-panel/utils/styles'
import { useThemeStore } from '../../../../../core/stores/themeStore'
import type { StyleConfig } from '../../../../../features/business-panel/contexts/OrganizationStylesContext'

interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'Asignado' | 'En progreso' | 'Completado'
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
  const { resolvedTheme } = useThemeStore()
  const isSystemLight = resolvedTheme === 'light'

  const primaryColor = styles?.primary_button_color || '#0A2540'
  const accentColor = styles?.accent_color || '#00D4B3'
  
  // Defaults adaptativos basados en el tema del sistema
  const defaultCardBg = isSystemLight ? '#FFFFFF' : '#1E2329'
  const defaultText = isSystemLight ? '#0F172A' : '#FFFFFF'
  const defaultBorder = isSystemLight ? '#E2E8F0' : '#334155'

  const cardBackground = styles?.card_background || defaultCardBg
  const textColor = styles?.text_color || defaultText
  const borderColor = styles?.border_color || defaultBorder
  const cardOpacity = styles?.card_opacity ?? 0.95

  // Determinar si estamos en modo claro basándonos en el color de fondo
  const isLightMode = cardBackground.toLowerCase() === '#ffffff' || 
                      cardBackground.toLowerCase() === '#f8fafc' ||
                      cardBackground.startsWith('rgb(255') ||
                      cardBackground.startsWith('rgba(255')

  // Calcular RGB para opacidad
  const cardBgRgb = hexToRgb(cardBackground)

  const getStatusColor = () => {
    switch (course.status) {
      case 'Completado':
        return 'from-green-500 to-emerald-500'
      case 'En progreso':
        return 'from-blue-500 to-cyan-500'
      default:
        return 'from-gray-500 to-gray-400'
    }
  }

  const getStatusIcon = () => {
    switch (course.status) {
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
        className={`group flex flex-row items-center gap-0 overflow-hidden rounded-2xl ${disableHeavyEffects ? '' : 'transition-all duration-200'} ${isLockedInPath ? 'cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}`}
        style={{
          backgroundColor: `rgba(${cardBgRgb}, ${cardOpacity})`,
          border: `1px solid ${isLightMode ? borderColor : 'rgba(255,255,255,0.07)'}`,
          animationDelay: `${index * 40}ms`,
          opacity: isLockedInPath ? 0.5 : 1,
        }}
        onClick={isLockedInPath ? undefined : onClick}
      >
        {/* Path position badge */}
        {learningPathPosition !== undefined && (
          <div
            className="shrink-0 flex items-center justify-center w-10 text-xs font-bold"
            style={{ color: isLockedInPath ? (isLightMode ? '#94A3B8' : '#6B7280') : accentColor }}
          >
            {isLockedInPath ? <Lock className="w-3.5 h-3.5" /> : `#${learningPathPosition}`}
          </div>
        )}

        {/* Thumbnail — small square, fixed 64×64 */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ width: 64, minWidth: 64, height: 64, backgroundColor: isLightMode ? '#F1F5F9' : '#0F172A' }}
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
          <p className="text-[11px] mt-0.5 truncate" style={{ color: isLightMode ? '#64748B' : '#9CA3AF' }}>
            {course.instructor}
          </p>
        </div>

        {/* Status badge — only on md+ */}
        <div
          className="hidden md:flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide text-white mx-3"
          style={{ background: `linear-gradient(135deg, ${primaryColor}cc, ${accentColor}cc)` }}
        >
          {getStatusIcon()}
          <span>{course.status}</span>
        </div>

        {/* Progress column */}
        <div className="shrink-0 flex flex-col items-end gap-1 pr-4 py-3 min-w-[100px]">
          <span className="text-xs font-bold tabular-nums" style={{ color: accentColor }}>
            {course.progress}%
          </span>
          <div
            className="h-1.5 w-20 rounded-full overflow-hidden"
            style={{ backgroundColor: isLightMode ? '#E2E8F0' : 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${course.progress}%`, background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
            />
          </div>
          {course.due_date && (
            <span className="text-[9px] mt-0.5" style={{ color: isLightMode ? '#94A3B8' : '#6B7280' }}>
              {new Date(course.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>

        {/* Certificate icon */}
        {course.has_certificate && course.progress === 100 && onCertificateClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onCertificateClick() }}
            className="shrink-0 mr-3 p-2 rounded-full transition-all duration-200 hover:scale-110"
            style={{ color: '#F59E0B', backgroundColor: isLightMode ? '#FEF3C7' : 'rgba(245,158,11,0.15)' }}
          >
            <Award className="w-4 h-4" />
          </button>
        )}
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
        style={{ backgroundColor: isLightMode ? '#F8FAFC' : '#0F172A' }}
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
            {course.status}
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
        <p className="text-[10px] mb-1 line-clamp-1" style={{ color: isLightMode ? '#64748B' : '#9CA3AF' }}>
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
            <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: isLightMode ? '#94A3B8' : '#858E9B' }}>
              Progreso
            </span>
            <span className="text-[10px] font-bold" style={{ color: accentColor }}>
              {course.progress}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: isLightMode ? '#F1F5F9' : 'rgba(255,255,255,0.08)' }}>
            <div
              className={`h-full rounded-full ${disableHeavyEffects ? '' : 'transition-all duration-700 ease-out'}`}
              style={{ width: `${course.progress}%`, background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})` }}
            />
          </div>
          <div className="h-[14px] mt-2">
            {course.due_date && (
              <p className="text-[9px] font-medium" style={{ color: isLightMode ? '#94A3B8' : '#858E9B' }}>
                Vence: {new Date(course.due_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
