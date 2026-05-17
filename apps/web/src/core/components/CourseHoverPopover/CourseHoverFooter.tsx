import { Star, Users } from 'lucide-react'
import type { CourseWithInstructor } from '../../../features/courses/services/course.service'

export function CourseHoverFooter({ course }: { course: CourseWithInstructor }) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-500/30">
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-warning text-warning" />
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {course.rating?.toFixed(1) || '0.0'}
        </span>
        {course.review_count && course.review_count > 0 && (
          <span className="text-xs text-gray-500 dark:text-white/60">
            ({course.review_count.toLocaleString()})
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-gray-500 dark:text-white/60" />
        <span className="text-xs text-gray-500 dark:text-white/70">
          {course.student_count?.toLocaleString() || 0} estudiantes
        </span>
      </div>
    </div>
  )
}
