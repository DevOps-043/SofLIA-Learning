import type { AssignedCourse, AssignedLearningPath } from '../../types'
import { buildCourseFromPathItem } from './course-builders'
import { EmptyPathMessage } from './EmptyPathMessage'
import { LearningPathCourseTile } from './LearningPathCourseTile'
import type {
  InfoHoverCardContent,
  LearningPathViewProps,
} from './types'

interface LearningPathItemsRowProps {
  assignedCoursesById: Map<string, AssignedCourse>
  disableHeavyEffects: boolean
  learningPath: AssignedLearningPath
  onCertificateClick?: LearningPathViewProps['onCertificateClick']
  onCourseClick: LearningPathViewProps['onCourseClick']
  onOpenCourse: LearningPathViewProps['onOpenCourse']
  onPreview: (anchor: HTMLElement, content: InfoHoverCardContent) => void
  onPreviewEnd: () => void
  orgColors: LearningPathViewProps['orgColors']
  setScrollerRef: (pathId: string, node: HTMLDivElement | null) => void
  t: LearningPathViewProps['t']
  visibleItemCount: number
}

export function LearningPathItemsRow({
  assignedCoursesById,
  disableHeavyEffects,
  learningPath,
  onCertificateClick,
  onCourseClick,
  onOpenCourse,
  onPreview,
  onPreviewEnd,
  orgColors,
  setScrollerRef,
  t,
  visibleItemCount,
}: LearningPathItemsRowProps) {
  const visibleItems = learningPath.items.slice(0, visibleItemCount)

  return (
    <div
      data-tour-id="business-user-dashboard--learning-path-row"
      ref={(node) => setScrollerRef(learningPath.id, node)}
      className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {visibleItems.length > 0 ? visibleItems.map((item) => {
        const assignedCourse = assignedCoursesById.get(item.courseId)
        const course = assignedCourse ?? buildCourseFromPathItem(item, learningPath, t)
        const openCourse = () => {
          if (assignedCourse) onCourseClick(course)
          else onOpenCourse(item.slug)
        }

        return (
          <LearningPathCourseTile
            key={`${learningPath.id}-${item.courseId}-${item.position}`}
            course={course}
            item={item}
            learningPathTitle={learningPath.title}
            orgColors={orgColors}
            onOpen={openCourse}
            onCertificateClick={course.progress === 100 && course.has_certificate && onCertificateClick ? () => onCertificateClick(course) : undefined}
            onPreview={onPreview}
            onPreviewEnd={onPreviewEnd}
            t={t}
            disableHeavyEffects={disableHeavyEffects}
          />
        )
      }) : (
        <EmptyPathMessage
          message={t('dashboard.learningPaths.emptyPath', 'Esta ruta aun no tiene cursos asignados.')}
          orgColors={orgColors}
        />
      )}
    </div>
  )
}
