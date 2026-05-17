import { BarChart3, BookOpen, Clock } from 'lucide-react'
import type React from 'react'
import type { CourseWithInstructor } from '../../../features/courses/services/course.service'
import { formatDuration, formatLevel } from './course-hover-formatters'

export function CourseHoverStats({ course }: { course: CourseWithInstructor }) {
  return (
    <div className="grid grid-cols-3 gap-3 border-y border-gray-200 py-3 dark:border-gray-500/30">
      <CourseStat icon={<Clock className="h-4 w-4" />} value={formatDuration(course.estimatedDuration)} />
      <CourseStat icon={<BookOpen className="h-4 w-4" />} value={formatLevel(course.difficulty)} />
      <CourseStat icon={<BarChart3 className="h-4 w-4" />} value="Subtítulos" />
    </div>
  )
}

function CourseStat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="mb-1 text-gray-500 dark:text-white/60">{icon}</span>
      <span className="text-xs font-medium text-gray-900 dark:text-white/80">
        {value}
      </span>
    </div>
  )
}
