import { motion } from 'framer-motion'
import { BookOpen, Clock, Star, Users, Video } from 'lucide-react'
import type { BusinessCourseDetail, BusinessCourseLevelStyles } from '../../types/business-course-detail.types'

interface BusinessCourseDetailHeroProps {
  course: BusinessCourseDetail
  levelStyles: BusinessCourseLevelStyles
  primaryColor: string
  accentColor: string
  textColor: string
  isDark: boolean
  formatDuration: (minutes: number | null) => string
}

export function BusinessCourseDetailHero({
  course,
  levelStyles,
  primaryColor,
  textColor,
  isDark,
  formatDuration
}: BusinessCourseDetailHeroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl overflow-hidden border shadow-sm"
      style={{ backgroundColor: isDark ? '#1E2329' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
    >
      <div className="relative h-72 xl:h-80">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${primaryColor}30, rgba(16, 185, 129, 0.2))` }}
          >
            <BookOpen className="w-24 h-24" style={{ color: `${primaryColor}50` }} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        <div className="absolute top-4 left-4 flex items-center gap-2">
          {course.category ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md" style={{ backgroundColor: `${primaryColor}90`, color: '#fff' }}>
              {course.category}
            </span>
          ) : null}
          {course.level ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md" style={{ backgroundColor: levelStyles.bg, color: levelStyles.color }}>
              {levelStyles.text}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-6 xl:p-8">
        <h1 className="text-2xl xl:text-3xl font-bold mb-4" style={{ color: textColor }}>
          {course.title}
        </h1>

        {course.description ? (
          <p className="text-base mb-6 line-clamp-3" style={{ color: isDark ? 'rgba(255,255,255,0.9)' : `${textColor}80` }}>
            {course.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-4 xl:gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" fill="#FACC15" />
            <span className="font-bold" style={{ color: textColor }}>{course.rating.toFixed(1)}</span>
            <span style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}60` }}>({course.review_count} resenas)</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}70` }}>
            <Users className="w-5 h-5" />
            <span>{course.student_count.toLocaleString()} estudiantes</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}70` }}>
            <Clock className="w-5 h-5" />
            <span>{formatDuration(course.stats.total_duration_minutes)}</span>
          </div>
          <div className="flex items-center gap-2" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}70` }}>
            <Video className="w-5 h-5" />
            <span>{course.stats.total_lessons} lecciones</span>
          </div>
        </div>

        {course.instructor ? (
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/10">
            {course.instructor.profile_picture_url ? (
              <div className="relative w-12 h-12 rounded-full overflow-hidden">
                <img src={course.instructor.profile_picture_url} alt={course.instructor.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full flex items-center justify-center !text-white font-bold" style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}>
                {course.instructor.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold" style={{ color: textColor }}>{course.instructor.name}</p>
              <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}60` }}>Instructor del curso</p>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
