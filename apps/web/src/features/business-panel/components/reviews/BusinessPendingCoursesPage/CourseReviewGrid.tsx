import { motion } from 'framer-motion'
import type { AdminCourse } from '@/features/admin/actions/adminCourses.actions'
import { CourseReviewCard } from './CourseReviewCard'
import type { ReviewTab, ReviewTranslator } from './types'

interface CourseReviewGridProps {
  activeTab: ReviewTab
  basePath: string
  courses: AdminCourse[]
  language: string
  tReviews: ReviewTranslator
  onApprove: (courseId: string) => void
  onDelete: (courseId: string) => void
  onReject: (courseId: string) => void
}

export function CourseReviewGrid({
  activeTab,
  basePath,
  courses,
  language,
  tReviews,
  onApprove,
  onDelete,
  onReject,
}: CourseReviewGridProps) {
  return (
    <motion.div
      id="tour-reviews-grid"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      {courses.map((course, index) => (
        <CourseReviewCard
          key={course.id}
          activeTab={activeTab}
          basePath={basePath}
          course={course}
          index={index}
          labels={{
            approveAction:
              activeTab === 'rejected' ? tReviews('actions.reconsider') : tReviews('actions.approve'),
            dangerAction:
              activeTab === 'pending' ? tReviews('actions.reject') : tReviews('actions.deletePermanently'),
            dateLabel: tReviews('labels.date'),
            instructorFallback: tReviews('fallbacks.pendingInstructor'),
            levelLabel: tReviews('labels.level'),
            notAvailable: tReviews('fallbacks.notAvailable'),
            statusBadge:
              course.approval_status === 'rejected' ? tReviews('badges.rejected') : tReviews('badges.pending'),
            typeBadge: course.is_update ? tReviews('badges.update') : tReviews('badges.new'),
            viewAction: tReviews('actions.view'),
          }}
          language={language}
          onApprove={onApprove}
          onDelete={onDelete}
          onReject={onReject}
        />
      ))}
    </motion.div>
  )
}
