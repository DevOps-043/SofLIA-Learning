'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  BookOpen,
  Star,
  Users,
  Clock,
  Play,
} from 'lucide-react'
import { type BusinessCourse } from '@/features/business-panel/hooks/useBusinessCourses'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useTranslation } from 'react-i18next'
import { useMotionSafe } from '@/lib/utils/motion'

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
      return { bg: `${difficultyColors.beginner}20`, color: difficultyColors.beginner, text: translate('courses.levels.beginner') }
    case 'intermediate':
    case 'intermedio':
      return { bg: `${difficultyColors.intermediate}20`, color: difficultyColors.intermediate, text: translate('courses.levels.intermediate') }
    case 'advanced':
    case 'avanzado':
      return { bg: `${difficultyColors.advanced}20`, color: difficultyColors.advanced, text: translate('courses.levels.advanced') }
    default:
      return { bg: `${difficultyColors.default}20`, color: difficultyColors.default, text: level || 'N/A' }
  }
}

export function CourseCard({ course, index, onClick }: CourseCardProps) {
  const { t } = useTranslation('business')
  const { disableHeavy, interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  const {
    primaryColor,
    textColor,
    cardBg,
    borderColor,
    dividerColor,
    mutedTextColor,
    difficultyColors,
  } = useBusinessPanelTheme()
  const levelStyles = getLevelStyles(course.level, t, difficultyColors)
  const entranceDelay = disableHeavy ? 0 : Math.min(index * interfaceStaggerSeconds, 0.08)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...interfaceTransition, delay: entranceDelay }}
      whileHover={disableHeavy ? undefined : { y: -2, scale: 1.005 }}
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-[1.5rem] border transition-all duration-300 shadow-sm hover:shadow-xl relative"
      style={{ backgroundColor: cardBg, borderColor }}
    >
      {/* Thumbnail - Standard Video Aspect Ratio for No Crop */}
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnail_url ? (
          <Image
            src={course.thumbnail_url}
            alt={course.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center bg-gray-900"
            style={{ background: `linear-gradient(135deg, ${primaryColor}40, ${primaryColor}10)` }}
          >
            <BookOpen className="w-10 h-10" style={{ color: `${primaryColor}60` }} />
          </div>
        )}

        {/* Level Badge Overlay */}
        <div className="absolute top-3 left-3">
          <span
            className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border"
            style={{ backgroundColor: levelStyles.bg, color: levelStyles.color, borderColor: `${levelStyles.color}30` }}
          >
            {levelStyles.text}
          </span>
        </div>

        {/* Rating Overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full backdrop-blur-md bg-black/40 border border-white/10">
          <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
          <span className="text-[9px] font-bold text-white">
            {course.rating ? course.rating.toFixed(1) : '0.0'}
          </span>
        </div>

        {/* Play Icon Hint */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
           <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 border border-white/30">
              <Play className="w-5 h-5 text-white ml-1 fill-white" />
           </div>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5">
        <div className="mb-4 min-h-[56px]">
          <h3 className="text-sm font-black tracking-tight line-clamp-2 leading-tight mb-1.5" style={{ color: textColor }}>
            {course.title}
          </h3>
          <p className="text-[10px] font-medium" style={{ color: mutedTextColor }}>
            {course.instructor.name}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3.5 border-t" style={{ borderColor: dividerColor }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5" style={{ color: mutedTextColor }}>
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-tight">{formatDuration(course.duration)}</span>
            </div>
            <div className="flex items-center gap-1.5" style={{ color: mutedTextColor }}>
              <Users className="w-3 h-3" />
              <span className="text-[10px] font-bold tracking-tight">{course.student_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
