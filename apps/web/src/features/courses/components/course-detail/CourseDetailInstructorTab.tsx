'use client'

import { resolveInstructorName } from '../../services/course-detail-display.service'
import type { CourseDetailCourse, CourseInstructorProfile } from '../../types/course-detail.types'

interface CourseDetailInstructorTabProps {
  course: CourseDetailCourse
  instructor: CourseInstructorProfile | null
}

export function CourseDetailInstructorTab({ course, instructor }: CourseDetailInstructorTabProps) {
  const instructorName = resolveInstructorName(course, instructor)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        {instructor?.profile_picture_url ? (
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-primary flex-shrink-0">
            <img src={instructor.profile_picture_url} alt={instructorName} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-success rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0 border-2 border-primary">
            {instructorName[0]?.toUpperCase() || 'I'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{instructorName}</h3>
          {instructor?.cargo_rol && (
            <p className="text-gray-600 dark:text-slate-300 text-lg mb-3">{instructor.cargo_rol}</p>
          )}
          {instructor?.location && <p className="text-gray-600 dark:text-slate-300 mb-4">{instructor.location}</p>}
        </div>
      </div>

      {course.instructor_email && (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <p className="text-gray-600 dark:text-slate-300 text-sm mb-1">Correo electronico</p>
          <a href={`mailto:${course.instructor_email}`} className="text-primary hover:text-primary/80 transition-colors font-medium break-all">
            {course.instructor_email}
          </a>
        </div>
      )}

      <div>
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Biografia</h4>
        {instructor?.bio ? (
          <p className="text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{instructor.bio}</p>
        ) : (
          <p className="text-gray-500 dark:text-slate-400 italic">No hay biografia disponible para este instructor.</p>
        )}
      </div>
    </div>
  )
}
