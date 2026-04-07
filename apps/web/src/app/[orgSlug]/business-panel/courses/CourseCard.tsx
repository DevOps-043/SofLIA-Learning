'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  BookOpen,
  Star,
  Users,
  Clock,
  Tag,
  Play,
  ChevronRight
} from 'lucide-react'
import { type BusinessCourse } from '@/features/business-panel/hooks/useBusinessCourses'
import { useTranslation } from 'react-i18next'

export interface CourseCardProps {
  course: BusinessCourse
  index: number
  primaryColor: string
  textColor: string
  cardBg: string
  onClick: () => void
  isDark?: boolean
}

type TranslateFn = (key: string) => string

function formatDuration(minutes: number | null): string {
  if (!minutes) return 'N/A'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

function getLevelStyles(level: string | null, translate: TranslateFn) {
  switch (level?.toLowerCase()) {
    case 'beginner':
    case 'principiante':
      return { bg: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', text: translate('courses.levels.beginner') }
    case 'intermediate':
    case 'intermedio':
      return { bg: 'rgba(234, 179, 8, 0.2)', color: '#EAB308', text: translate('courses.levels.intermediate') }
    case 'advanced':
    case 'avanzado':
      return { bg: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', text: translate('courses.levels.advanced') }
    default:
      return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', text: level || 'N/A' }
  }
}

export function CourseCard({ course, index, primaryColor, textColor, cardBg, onClick, isDark }: CourseCardProps) {
  const { t } = useTranslation('business')
  const levelStyles = getLevelStyles(course.level, t)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -6, scale: 1.02 }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm hover:shadow-md"
      style={{ backgroundColor: cardBg, borderColor: 'rgba(0,0,0,0.05)' }}
    >
      {/* Thumbnail with Overlay */}
      <div className="relative h-44 overflow-hidden">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)` }}
          >
            <BookOpen className="w-16 h-16" style={{ color: `${primaryColor}60` }} />
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Level Badge */}
        <div className="absolute top-3 left-3">
          <span
            className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md"
            style={{ backgroundColor: levelStyles.bg, color: levelStyles.color }}
          >
            {levelStyles.text}
          </span>
        </div>

        {/* Play Button on Hover */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20"
            style={{ backgroundColor: `${primaryColor}90` }}
          >
            <Play className="w-6 h-6 text-white ml-1" fill="white" />
          </div>
        </motion.div>

        {/* Rating Badge */}
        <div
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-md"
          style={{
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.9)'
          }}
        >
          <Star className="w-3.5 h-3.5" style={{ color: '#FACC15', fill: '#FACC15' }} />
          <span className="text-xs font-semibold" style={{ color: isDark ? '#FFFFFF' : '#0A2540' }}>
            {course.rating ? course.rating.toFixed(1) : '0.0'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        {course.category && (
          <div className="flex items-center gap-1.5 mb-2">
            <Tag className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span className="text-xs font-medium" style={{ color: primaryColor }}>
              {course.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3
          className="text-base font-bold mb-2 line-clamp-2 group-hover:text-primary transition-colors"
          style={{ color: textColor }}
        >
          {course.title}
        </h3>

        {/* Description */}
        <p
          className="text-sm mb-4 line-clamp-2"
          style={{ color: textColor, opacity: 0.7 }}
        >
          {course.description || t('courses.card.noDescription')}
        </p>

        {/* Instructor */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)` }}
          >
            {course.instructor.name[0].toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: textColor }}>
              {course.instructor.name}
            </p>
            <p className="text-xs" style={{ color: textColor, opacity: 0.6 }}>
              {t('courses.card.instructor')}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5" style={{ color: textColor, opacity: 0.6 }}>
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">{formatDuration(course.duration)}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: textColor, opacity: 0.6 }}>
              <Users className="w-4 h-4" />
              <span className="text-xs font-medium">{course.student_count || 0}</span>
            </div>
          </div>

          {/* Arrow */}
          <motion.div
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group/arrow"
            style={{
              backgroundColor: isDark ? 'transparent' : '#E9ECEF',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #6C757D'
            }}
            whileHover={{
              backgroundColor: primaryColor,
              borderColor: 'transparent'
            }}
          >
            <ChevronRight
              className="w-4 h-4 transition-colors group-hover/arrow:text-white"
              style={{
                color: isDark ? 'rgba(255,255,255,0.5)' : '#6C757D'
              }}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
