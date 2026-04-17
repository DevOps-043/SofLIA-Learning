'use client'

import Image from 'next/image'
import { Award, Play, BookOpen, CheckCircle2 } from 'lucide-react'
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
  viewMode = 'grid'
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

  return (
    <div
      className={`group relative flex overflow-hidden rounded-[20px] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${viewMode === 'list' ? 'flex-row items-stretch' : 'flex-col'}`}
      style={{
        backgroundColor: `rgba(${cardBgRgb}, ${cardOpacity})`,
        border: `1px solid ${isLightMode ? borderColor : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: isLightMode ? '0 4px 20px -10px rgba(0,0,0,0.08)' : 'none',
        animationDelay: `${index * 50}ms`
      }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div 
        className={`relative bg-black/5 overflow-hidden border-r shrink-0 ${viewMode === 'list' ? 'w-[40%] sm:w-[35%] max-h-[120px] sm:max-h-none lg:min-w-[240px] lg:max-w-[300px]' : 'aspect-video w-full'}`} 
        style={{ 
          backgroundColor: isLightMode ? '#F8FAFC' : '#0F172A',
          borderColor: isLightMode ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
        }}
      >
        <Image
          src={course.thumbnail || '/images/course-placeholder.png'}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Subtle shadow inside image instead of massive gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

        {/* Minimalist Status badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase text-white bg-black/40 backdrop-blur-md border border-white/20">
          {getStatusIcon()}
          {course.status}
        </div>

        {/* Minimalist Certificate button */}
        {course.has_certificate && course.progress === 100 && onCertificateClick && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCertificateClick()
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-yellow-400 transition-all duration-300 hover:scale-110 hover:bg-white hover:text-yellow-600 shadow-sm"
          >
            <Award className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className={`flex flex-col flex-1 ${viewMode === 'list' ? 'p-3 sm:p-4 lg:p-5' : 'p-3.5'}`}>
        <h3 
          className="text-sm font-bold leading-snug mb-1 transition-colors group-hover:opacity-80"
          style={{ color: textColor }}
        >
          {course.title}
        </h3>
        <p 
          className="text-[#9CA3AF] text-[10px] mb-2 line-clamp-1"
          style={{ color: isLightMode ? '#64748B' : '#9CA3AF' }}
        >
          {course.instructor}
        </p>

        {/* Bottom Area: Progress bar & Due Date */}
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span 
              className="text-[9px] uppercase tracking-wider font-semibold"
              style={{ color: isLightMode ? '#94A3B8' : '#858E9B' }}
            >
              Progreso
            </span>
            <span className="text-[10px] font-bold" style={{ color: accentColor }}>
              {course.progress}%
            </span>
          </div>
          <div 
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ 
              backgroundColor: isLightMode ? '#F1F5F9' : 'rgba(255, 255, 255, 0.08)' 
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${course.progress}%`,
                background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`
              }}
            />
          </div>

          {/* Constant height container for Due date to keep progress bars aligned perfectly */}
          <div className="h-[14px] mt-2">
            {course.due_date && (
              <p 
                className="text-[9px] font-medium"
                style={{ color: isLightMode ? '#94A3B8' : '#858E9B' }}
              >
                Vence: {new Date(course.due_date).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
