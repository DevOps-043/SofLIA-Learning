import { motion } from 'framer-motion'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import { CourseReviewDetails } from './CourseReviewDetails'
import { CourseReviewImage } from './CourseReviewImage'
import type { ReviewCourseCardProps } from './types'

export function CourseReviewCard({
  activeTab,
  basePath,
  course,
  index,
  labels,
  language,
  onApprove,
  onDelete,
  onReject,
}: ReviewCourseCardProps) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="rounded-[28px] overflow-hidden border"
      style={{
        backgroundColor: panelTheme.cardBg,
        borderColor: panelTheme.borderColor,
        boxShadow: panelTheme.isDark
          ? '0 18px 44px -26px rgba(0,0,0,0.55)'
          : '0 18px 34px -28px rgba(15,23,42,0.18)',
      }}
    >
      <CourseReviewImage course={course} labels={labels} />
      <CourseReviewDetails
        activeTab={activeTab}
        basePath={basePath}
        course={course}
        labels={labels}
        language={language}
        onApprove={onApprove}
        onDelete={onDelete}
        onReject={onReject}
      />
    </motion.article>
  )
}
