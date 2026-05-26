import type { AssignedCourse, AssignedLearningPathItem } from '../../types'
import { LearningPathCourseTile } from './LearningPathCourseTile'
import type {
  InfoHoverCardContent,
  LearningPathViewProps,
} from './types'

interface StandaloneItemsRowProps {
  courses: AssignedCourse[]
  disableHeavyEffects: boolean
  items: AssignedLearningPathItem[]
  onCertificateClick?: LearningPathViewProps['onCertificateClick']
  onCourseClick: LearningPathViewProps['onCourseClick']
  onPreview: (anchor: HTMLElement, content: InfoHoverCardContent) => void
  onPreviewEnd: () => void
  orgColors: LearningPathViewProps['orgColors']
  setScrollerRef: (pathId: string, node: HTMLDivElement | null) => void
  standalonePathId: string
  title: string
  t: LearningPathViewProps['t']
}

export function StandaloneItemsRow({
  courses,
  disableHeavyEffects,
  items,
  onCertificateClick,
  onCourseClick,
  onPreview,
  onPreviewEnd,
  orgColors,
  setScrollerRef,
  standalonePathId,
  title,
  t,
}: StandaloneItemsRowProps) {
  return (
    <div
      data-tour-id="business-user-dashboard--learning-path-row"
      ref={(node) => setScrollerRef(standalonePathId, node)}
      className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {courses.map((course, index) => {
        const item = items[index]
        if (!item) return null

        return (
          <LearningPathCourseTile
            key={`${standalonePathId}-${course.course_id}`}
            course={course}
            item={item}
            learningPathTitle={title}
            orgColors={orgColors}
            onOpen={() => onCourseClick(course)}
            onCertificateClick={course.progress === 100 && course.has_certificate && onCertificateClick ? () => onCertificateClick(course) : undefined}
            onPreview={onPreview}
            onPreviewEnd={onPreviewEnd}
            t={t}
            disableHeavyEffects={disableHeavyEffects}
          />
        )
      })}
    </div>
  )
}
