import { motion } from 'framer-motion'
import { Github, Globe, GraduationCap, Linkedin, Mail } from 'lucide-react'
import type { BusinessCourseDetail } from '../../types/business-course-detail.types'

interface BusinessCourseInstructorTabProps {
  course: BusinessCourseDetail
  textColor: string
  primaryColor: string
  accentColor: string
  onPrimaryColor: string
  mutedTextColor: string
}

export function BusinessCourseInstructorTab({
  course,
  textColor,
  primaryColor,
  accentColor,
  onPrimaryColor,
  mutedTextColor,
}: BusinessCourseInstructorTabProps) {
  return (
    <motion.div
      key="instructor"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      {course.instructor ? (
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            {course.instructor.profile_picture_url ? (
              <div
                className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-2"
                style={{ borderColor: primaryColor }}
              >
                <img
                  src={course.instructor.profile_picture_url}
                  alt={course.instructor.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-2xl text-3xl font-bold"
                style={{ backgroundColor: primaryColor, color: onPrimaryColor }}
              >
                {course.instructor.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="mb-1 text-2xl font-bold" style={{ color: textColor }}>
                {course.instructor.name}
              </h3>
              <p className="mb-4 text-lg" style={{ color: mutedTextColor }}>
                Instructor
              </p>
              <div className="flex items-center gap-3">
                {course.instructor.linkedin_url ? (
                  <a
                    href={course.instructor.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                ) : null}
                {course.instructor.github_url ? (
                  <a
                    href={course.instructor.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                    style={{ backgroundColor: `${textColor}12`, color: textColor }}
                  >
                    <Github className="h-5 w-5" />
                  </a>
                ) : null}
                {course.instructor.website_url ? (
                  <a
                    href={course.instructor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                    style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                  >
                    <Globe className="h-5 w-5" />
                  </a>
                ) : null}
                {course.instructor.email ? (
                  <a
                    href={`mailto:${course.instructor.email}`}
                    className="flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                    style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                  >
                    <Mail className="h-5 w-5" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          {course.instructor.bio ? (
            <div
              className="rounded-xl border p-5"
              style={{ backgroundColor: `${primaryColor}05`, borderColor: `${primaryColor}18` }}
            >
              <h4 className="mb-3 font-bold" style={{ color: textColor }}>
                Biografía
              </h4>
              <p className="whitespace-pre-line leading-relaxed" style={{ color: textColor }}>
                {course.instructor.bio}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div
            className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${primaryColor}15` }}
          >
            <GraduationCap className="h-10 w-10" style={{ color: mutedTextColor }} />
          </div>
          <h4 className="mb-2 text-lg font-semibold" style={{ color: textColor }}>
            Información del instructor no disponible
          </h4>
          <p className="text-sm" style={{ color: mutedTextColor }}>
            Este curso aún no tiene un instructor asignado o la información no está disponible.
          </p>
        </div>
      )}
    </motion.div>
  )
}
