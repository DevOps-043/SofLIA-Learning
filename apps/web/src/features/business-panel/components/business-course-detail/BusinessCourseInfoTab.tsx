import { motion } from 'framer-motion'
import { CheckCircle, Clock, FileText, Target, Users, Video } from 'lucide-react'
import type { BusinessCourseDetail } from '../../types/business-course-detail.types'

interface BusinessCourseInfoTabProps {
  course: BusinessCourseDetail
  textColor: string
  borderColor: string
  primaryColor: string
  accentColor: string
  isDark: boolean
  formatDuration: (minutes: number | null) => string
}

export function BusinessCourseInfoTab({
  course,
  textColor,
  borderColor,
  primaryColor,
  accentColor,
  isDark,
  formatDuration
}: BusinessCourseInfoTabProps) {
  return (
    <motion.div key="info" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <div className="space-y-8">
        {course.learning_objectives.length > 0 ? (
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
              <Target className="w-6 h-6" style={{ color: primaryColor }} />
              Lo que aprenderas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {course.learning_objectives.map((objective, index) => (
                <motion.div
                  key={objective}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-4 rounded-xl border"
                  style={{ backgroundColor: `${primaryColor}08`, borderColor }}
                >
                  <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: accentColor }} />
                  <span style={{ color: `${textColor}90` }}>{objective}</span>
                </motion.div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-2 2xl:grid-cols-4 gap-4">
          {[
            { icon: FileText, label: 'Modulos', value: course.stats.total_modules },
            { icon: Video, label: 'Lecciones', value: course.stats.total_lessons },
            { icon: Clock, label: 'Duracion', value: formatDuration(course.stats.total_duration_minutes) },
            { icon: Users, label: 'Estudiantes', value: course.student_count.toLocaleString() }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
                borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : borderColor
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-5 h-5" style={{ color: '#10B981' }} />
                <span className="text-sm font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}70` }}>{stat.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: textColor }}>{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {course.description ? (
          <div>
            <h3 className="text-xl font-bold mb-4" style={{ color: textColor }}>Descripcion del Curso</h3>
            <p className="leading-relaxed whitespace-pre-line" style={{ color: `${textColor}80` }}>
              {course.description}
            </p>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
