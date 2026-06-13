'use client'

import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/utils/cn'
import type { NotebookCourse } from '../types'

interface NotebookCourseFilterProps {
  courses: NotebookCourse[]
  selectedCourseId: string | null
  onSelect: (courseId: string | null) => void
  isLoading: boolean
}

/**
 * NotebookCourseFilter
 *
 * Horizontal scrollable course pills for the "By course" tab.
 * Includes an "All" pill and one per course, with note counts.
 */
export function NotebookCourseFilter({
  courses,
  selectedCourseId,
  onSelect,
  isLoading,
}: NotebookCourseFilterProps) {
  const { t } = useTranslation('common')

  if (isLoading) {
    return (
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-9 w-28 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0"
          />
        ))}
      </div>
    )
  }

  if (courses.length === 0) return null

  return (
    <div
      className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin"
    >
      {/* "All courses" pill */}
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border',
          !selectedCourseId
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-transparent shadow-md shadow-teal-500/20'
            : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700',
        )}
      >
        {t('notebook.courseFilter.allCourses')}
      </button>

      {courses.map((course) => {
        const isActive = selectedCourseId === course.courseId
        const totalCount = course.notesCount

        return (
          <button
            key={course.courseId}
            onClick={() => onSelect(course.courseId)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border flex items-center gap-2',
              isActive
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white border-transparent shadow-md shadow-teal-500/20'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700',
            )}
          >
            <span className="truncate max-w-[160px]">{course.courseTitle}</span>
            <span
              className={cn(
                'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
              )}
            >
              {totalCount}
            </span>
          </button>
        )
      })}
    </div>
  )
}
