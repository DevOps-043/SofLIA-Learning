'use client'

import { CheckCircle, Clock, FileText, Users, Video } from 'lucide-react'
import { formatCourseDuration } from '../../services/course-detail-display.service'
import type { CourseDetailCourse, CourseDetailSkill, CourseDetailSummary } from '../../types/course-detail.types'

interface CourseDetailInfoTabProps {
  course: CourseDetailCourse
  skills: CourseDetailSkill[]
  summary: CourseDetailSummary
}

export function CourseDetailInfoTab({ course, skills, summary }: CourseDetailInfoTabProps) {
  return (
    <div className="space-y-6">
      {course.learning_objectives && course.learning_objectives.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Lo que aprenderas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {course.learning_objectives.map((objective, index) => (
              <div key={`${objective}-${index}`} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-gray-700 dark:text-slate-200">{objective}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {course.description && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Descripcion del Curso</h3>
          <p className="text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{course.description}</p>
        </div>
      )}

      {skills.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills que Aprenderas</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <span key={skill.id} className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20">
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-primary" />
            <span className="text-gray-600 dark:text-slate-300 text-sm">Modulos</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalModules}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-5 h-5 text-primary" />
            <span className="text-gray-600 dark:text-slate-300 text-sm">Lecciones</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalLessons}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-gray-600 dark:text-slate-300 text-sm">Duracion</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCourseDuration(summary.totalDurationMinutes)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 shadow-sm dark:shadow-none">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-gray-600 dark:text-slate-300 text-sm">Estudiantes</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{course.student_count?.toLocaleString() || '0'}</p>
        </div>
      </div>
    </div>
  )
}
