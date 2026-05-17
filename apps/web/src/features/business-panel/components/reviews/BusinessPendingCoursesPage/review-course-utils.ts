import type { AdminCourse } from '@/features/admin/actions/adminCourses.actions'
import type { ReviewCounts, ReviewTab } from './types'

export function getReviewCounts(courses: AdminCourse[]): ReviewCounts {
  return courses.reduce(
    (counts, course) => ({
      pending: counts.pending + (course.approval_status === 'pending' ? 1 : 0),
      rejected: counts.rejected + (course.approval_status === 'rejected' ? 1 : 0),
      updates: counts.updates + (course.is_update ? 1 : 0),
      fresh: counts.fresh + (!course.is_update ? 1 : 0),
    }),
    { pending: 0, rejected: 0, updates: 0, fresh: 0 },
  )
}

export function filterReviewCourses({
  activeTab,
  courses,
  searchTerm,
}: {
  activeTab: ReviewTab
  courses: AdminCourse[]
  searchTerm: string
}) {
  const query = searchTerm.trim().toLowerCase()

  return courses.filter((course) => {
    if (course.approval_status !== activeTab) return false
    if (!query) return true

    return [course.title, course.instructor_name, course.category, course.level]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  })
}
