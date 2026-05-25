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
          background: `color-mix(in srgb, ${panelTheme.dangerColor} 9.4%, transparent)`,
          border: `color-mix(in srgb, ${panelTheme.dangerColor} 19.6%, transparent)`,
        }
      : {
          color: panelTheme.warningColor,
          background: `color-mix(in srgb, ${panelTheme.warningColor} 9.4%, transparent)`,
          border: `color-mix(in srgb, ${panelTheme.warningColor} 19.6%, transparent)`,
        }
  const typeTone = course.is_update
    ? {
        color: panelTheme.brandColor,
        background: `color-mix(in srgb, ${panelTheme.brandColor} 9.4%, transparent)`,
        border: `color-mix(in srgb, ${panelTheme.brandColor} 19.6%, transparent)`,
      }
    : {
        color: panelTheme.successColor,
        background: `color-mix(in srgb, ${panelTheme.successColor} 9.4%, transparent)`,
        border: `color-mix(in srgb, ${panelTheme.successColor} 19.6%, transparent)`,
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
