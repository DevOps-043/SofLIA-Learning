import type { AdminCourse } from '@/features/admin/actions/adminCourses.actions'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import { CourseThumbnail } from './CourseThumbnail'
import { ReviewBadge } from './ReviewBadge'
import type { ReviewCourseCardLabels } from './types'

interface CourseReviewImageProps {
  course: AdminCourse
  labels: ReviewCourseCardLabels
}

export function CourseReviewImage({ course, labels }: CourseReviewImageProps) {
  const panelTheme = useBusinessPanelTheme()
  const statusTone =
    course.approval_status === 'rejected'
      ? {
          color: panelTheme.dangerColor,
          background: `${panelTheme.dangerColor}18`,
          border: `${panelTheme.dangerColor}32`,
        }
      : {
          color: panelTheme.warningColor,
          background: `${panelTheme.warningColor}18`,
          border: `${panelTheme.warningColor}32`,
        }
  const typeTone = course.is_update
    ? {
        color: panelTheme.brandColor,
        background: `${panelTheme.brandColor}18`,
        border: `${panelTheme.brandColor}32`,
      }
    : {
        color: panelTheme.successColor,
        background: `${panelTheme.successColor}18`,
        border: `${panelTheme.successColor}32`,
      }

  return (
    <div className="relative h-52 overflow-hidden">
      <CourseThumbnail thumbnailUrl={course.thumbnail_url} title={course.title} />
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(15,23,42,0.84) 100%)',
        }}
      />
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <ReviewBadge label={labels.statusBadge} tone={statusTone} />
        <ReviewBadge label={labels.typeBadge} tone={typeTone} />
      </div>
    </div>
  )
}
