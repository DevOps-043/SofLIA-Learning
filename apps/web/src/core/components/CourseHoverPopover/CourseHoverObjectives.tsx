import { CheckCircle2 } from 'lucide-react'
import type { CourseWithInstructor } from '../../../features/courses/services/course.service'

export function CourseHoverObjectives({ course }: { course: CourseWithInstructor }) {
  const objectives = Array.isArray(course.learning_objectives)
    ? course.learning_objectives.slice(0, 3)
    : []

  if (objectives.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        Lo que aprenderás:
      </h4>
      <ul className="space-y-2">
        {objectives.map((objective, index) => (
          <li key={index} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
            <span className="text-xs leading-relaxed text-gray-500 dark:text-white/70">
              {typeof objective === 'string' ? objective : JSON.stringify(objective)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
