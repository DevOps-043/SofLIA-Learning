import type { CourseWithInstructor } from '../../../features/courses/services/course.service'
import {
  getUpdateDate,
  truncateDescription,
} from './course-hover-formatters'
import { CourseHoverBadges } from './CourseHoverBadges'
import { CourseHoverFooter } from './CourseHoverFooter'
import { CourseHoverObjectives } from './CourseHoverObjectives'
import { CourseHoverStats } from './CourseHoverStats'

export function CourseHoverContent({ course }: { course: CourseWithInstructor }) {
  return (
    <div className="space-y-4 p-5">
      <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-gray-900 dark:text-white">
        {course.title}
      </h3>

      <CourseHoverBadges course={course} />

      <p className="text-xs font-medium text-success">
        {getUpdateDate(course)}
      </p>

      <CourseHoverStats course={course} />

      <p className="text-sm leading-relaxed text-gray-500 dark:text-white/80">
        {truncateDescription(course.description)}
      </p>

      <CourseHoverObjectives course={course} />
      <CourseHoverFooter course={course} />
    </div>
  )
}
