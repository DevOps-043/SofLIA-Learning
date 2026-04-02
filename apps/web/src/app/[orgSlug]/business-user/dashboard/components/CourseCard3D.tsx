'use client'

import Image from 'next/image'
import { Award, Play, BookOpen, CheckCircle2 } from 'lucide-react'
import { hexToRgb } from '../../../../../features/business-panel/utils/styles'
import { useThemeStore } from '../../../../../core/stores/themeStore'

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
  styles?: any
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
  styles
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
      className="group relative overflow-hidden rounded-2xl backdrop-blur-xl cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
      style={{
        backgroundColor: `rgba(${cardBgRgb}, ${cardOpacity})`,
        border: `1px solid ${isLightMode ? borderColor : 'rgba(255, 255, 255, 0.1)'}`,
        animationDelay: `${index * 100}ms`
      }}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative h-40 overflow-hidden">
        <Image
          src={course.thumbnail || '/images/course-placeholder.png'}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Overlay gradient */}
        <div 
          className="absolute inset-0"
          style={{
            background: isLightMode 
              ? 'linear-gradient(to top, rgba(255,255,255,0.9), transparent, transparent)'
              : 'linear-gradient(to top, rgba(15,23,42,0.9), transparent, transparent)'
          }}
        />

        {/* Status badge */}
        <div 
          className={`absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getStatusColor()}`}
        >
          {getStatusIcon()}
          {course.status}
        </div>

        {/* Certificate button */}
        {course.has_certificate && course.progress === 100 && onCertificateClick && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCertificateClick()
            }}
            className="absolute top-3 right-3 p-2 rounded-full bg-yellow-500/90 text-white transition-all duration-200 hover:scale-110 hover:bg-yellow-500"
          >
            <Award className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 
          className="text-lg font-semibold mb-1 line-clamp-2 transition-colors"
          style={{ 
            color: textColor,
          }}
        >
          {course.title}
        </h3>
        <p 
          className="text-sm mb-4"
          style={{ color: isLightMode ? '#64748B' : '#9CA3AF' }}
        >
          {course.instructor}
        </p>

        {/* Progress bar */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span 
              className="text-xs"
              style={{ color: isLightMode ? '#64748B' : '#9CA3AF' }}
            >
              Progreso
            </span>
            <span className="text-xs font-medium" style={{ color: accentColor }}>
              {course.progress}%
            </span>
          </div>
          <div 
            className="h-2 rounded-full overflow-hidden"
            style={{ 
              backgroundColor: isLightMode ? '#E2E8F0' : 'rgba(55, 65, 81, 0.5)' 
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${course.progress}%`,
                background: `linear-gradient(90deg, ${primaryColor}, ${accentColor})`
              }}
            />
          </div>
        </div>

        {/* Due date */}
        {course.due_date && (
          <p 
            className="text-xs mt-3"
            style={{ color: isLightMode ? '#94A3B8' : '#6B7280' }}
          >
            Fecha límite: {new Date(course.due_date).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        )}
      </div>

      {/* Border gradient */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}40, transparent, ${accentColor}25)`,
          padding: '1px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor'
        }}
      />
    </div>
  )
}
