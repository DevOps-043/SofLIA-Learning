import { motion } from 'framer-motion'
import { Github, Globe, GraduationCap, Linkedin, Mail } from 'lucide-react'
import type { BusinessCourseDetail } from '../../types/business-course-detail.types'

interface BusinessCourseInstructorTabProps {
  course: BusinessCourseDetail
  textColor: string
  primaryColor: string
  accentColor: string
  isDark: boolean
}

export function BusinessCourseInstructorTab({
  course,
  textColor,
  primaryColor,
  accentColor,
  isDark
}: BusinessCourseInstructorTabProps) {
  return (
    <motion.div key="instructor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      {course.instructor ? (
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            {course.instructor.profile_picture_url ? (
              <div className="relative w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border-2" style={{ borderColor: primaryColor }}>
                <img src={course.instructor.profile_picture_url} alt={course.instructor.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center !text-white text-3xl font-bold flex-shrink-0" style={{ backgroundColor: primaryColor, color: '#FFFFFF' }}>
                {course.instructor.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="text-2xl font-bold mb-1" style={{ color: textColor }}>{course.instructor.name}</h3>
              <p className="text-lg mb-4" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}60` }}>Instructor</p>
              <div className="flex items-center gap-3">
                {course.instructor.linkedin_url ? (
                  <a
                    href={course.instructor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: '#0077B520', color: '#0077B5' }}
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                ) : null}
                {course.instructor.github_url ? (
                  <a
                    href={course.instructor.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 text-white transition-colors hover:bg-white/20"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                ) : null}
                {course.instructor.website_url ? (
                  <a
                    href={course.instructor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    <Globe className="w-5 h-5" />
                  </a>
                ) : null}
                {course.instructor.email ? (
                  <a
                    href={`mailto:${course.instructor.email}`}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {course.instructor.bio ? (
            <div className="p-5 rounded-xl border border-white/10" style={{ backgroundColor: `${primaryColor}05` }}>
              <h4 className="font-bold mb-3" style={{ color: textColor }}>Biografia</h4>
              <p className="leading-relaxed whitespace-pre-line" style={{ color: isDark ? 'rgba(255,255,255,0.85)' : `${textColor}80` }}>
                {course.instructor.bio}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
            <GraduationCap className="w-10 h-10" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : `${textColor}40` }} />
          </div>
          <h4 className="text-lg font-semibold mb-2" style={{ color: textColor }}>
            Informacion del instructor no disponible
          </h4>
          <p className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : `${textColor}50` }}>
            Este curso aun no tiene un instructor asignado o la informacion no esta disponible.
          </p>
        </div>
      )}
    </motion.div>
  )
}
