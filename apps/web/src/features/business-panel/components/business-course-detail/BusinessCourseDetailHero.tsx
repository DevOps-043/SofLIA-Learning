'use client'

import { motion } from 'framer-motion'
import { Star, Clock, Video } from 'lucide-react'
import type { BusinessCourseDetail, BusinessCourseLevelStyles } from '../../types/business-course-detail.types'

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
  primaryColor,
  accentColor,
  textColor,
  mutedTextColor,
  borderColor,
  formatDuration
}: BusinessCourseDetailHeroProps) {
  return (
    <div className="relative w-full mb-4 lg:mb-8 pt-2 lg:pt-4">
      <div className="flex flex-col lg:flex-row gap-6 xl:gap-12 items-start lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full lg:w-[40%] xl:w-[45%] relative group shrink-0"
        >
          <div
            className="relative aspect-video rounded-[2rem] overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] border"
            style={{ borderColor }}
          >
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
              >
                <div className="p-6 rounded-full bg-white/10 backdrop-blur-xl border border-white/20">
                  <Video className="w-12 h-12 text-white" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 space-y-4 lg:space-y-6 min-w-0"
        >
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border"
              style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 6.3%, transparent)`, color: mutedTextColor, borderColor }}
            >
              {course.category || 'Curso Profundo'}
            </span>
            <span
              className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] border"
              style={{ backgroundColor: `color-mix(in srgb, ${levelStyles.color} 6.3%, transparent)`, color: levelStyles.color, borderColor: `color-mix(in srgb, ${levelStyles.color} 12.5%, transparent)` }}
            >
              {levelStyles.text}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl xl:text-4xl font-black tracking-tight leading-[1.1] max-w-2xl" style={{ color: textColor }}>
            {course.title}
          </h1>

          <div className="flex items-center gap-4 py-3 lg:py-5 border-y" style={{ borderColor }}>
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
              style={{ backgroundColor: `color-mix(in srgb, ${primaryColor} 6.3%, transparent)`, borderColor }}
            >
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
              <span className="text-base font-black" style={{ color: textColor }}>{course.rating.toFixed(1)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: mutedTextColor }}>Valoracion</span>
              <span className="text-[9px] font-medium" style={{ color: mutedTextColor }}>{course.review_count} opiniones</span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2" style={{ color: textColor }}>
                <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                <span className="text-xs font-bold">{formatDuration(course.stats.total_duration_minutes)}</span>
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest ml-5" style={{ color: mutedTextColor }}>Duracion</p>
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2" style={{ color: textColor }}>
                <Video className="w-3.5 h-3.5 shrink-0" style={{ color: accentColor }} />
                <span className="text-xs font-bold">{course.stats.total_lessons} Lecciones</span>
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest ml-5" style={{ color: mutedTextColor }}>Material</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
