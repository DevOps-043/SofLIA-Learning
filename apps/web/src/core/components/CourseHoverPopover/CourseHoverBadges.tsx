import { Award, TrendingUp } from 'lucide-react'
import type { CourseWithInstructor } from '../../../features/courses/services/course.service'

export function CourseHoverBadges({ course }: { course: CourseWithInstructor }) {
  return (
    <div className="flex flex-wrap gap-2">
      {course.status === 'Adquirido' && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent dark:bg-accent/20">
          <Award className="h-3.5 w-3.5" />
          Premium
        </span>
      )}
      {course.student_count && course.student_count > 100 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-3 py-1 text-xs font-semibold text-success dark:bg-success/20">
          <TrendingUp className="h-3.5 w-3.5" />
          Lo más vendido
        </span>
      )}
    </div>
  )
}
