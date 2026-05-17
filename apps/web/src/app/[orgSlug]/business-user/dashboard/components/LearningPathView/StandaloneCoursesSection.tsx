import { motion, type Transition } from 'framer-motion'
import type { AssignedCourse, AssignedLearningPathItem } from '../../types'
import { INITIAL_VISIBLE_PATH_ITEMS, STANDALONE_PATH_ID } from './constants'
import { ScrollArrowButton } from './ScrollArrowButton'
import { ShowMoreButton } from './ShowMoreButton'
import { StandaloneItemsRow } from './StandaloneItemsRow'
import { getStandaloneSummary } from './summary'
import type {
  InfoHoverCardContent,
  LearningPathViewProps,
} from './types'

interface StandaloneCoursesSectionProps {
  courses: AssignedCourse[]
  disableHeavyEffects: boolean
  interfaceStaggerSeconds: number
  interfaceTransition: Transition
  items: AssignedLearningPathItem[]
  learningPathCount: number
  onCertificateClick?: LearningPathViewProps['onCertificateClick']
  onCourseClick: LearningPathViewProps['onCourseClick']
  onPreview: (anchor: HTMLElement, content: InfoHoverCardContent) => void
  onPreviewEnd: () => void
  orgColors: LearningPathViewProps['orgColors']
  scrollPath: (pathId: string, direction: 'left' | 'right') => void
  setScrollerRef: (pathId: string, node: HTMLDivElement | null) => void
  showMorePathItems: (pathId: string, totalItems: number) => void
  t: LearningPathViewProps['t']
  visibleItemCount?: number
}

export function StandaloneCoursesSection({
  courses,
  disableHeavyEffects,
  interfaceStaggerSeconds,
  interfaceTransition,
  items,
  learningPathCount,
  visibleItemCount = Math.min(INITIAL_VISIBLE_PATH_ITEMS, items.length),
  ...props
}: StandaloneCoursesSectionProps) {
  const title = props.t('dashboard.learningPaths.standaloneTitle', 'Cursos independientes')
  const visibleCourses = courses.slice(0, visibleItemCount)
  const hasHiddenItems = visibleItemCount < courses.length

  return (
    <motion.section
      key={STANDALONE_PATH_ID}
      initial={disableHeavyEffects ? false : { opacity: 0, y: 12 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      transition={disableHeavyEffects ? undefined : {
        ...interfaceTransition,
        delay: Math.min(learningPathCount * interfaceStaggerSeconds, 0.08),
      }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="inline-block max-w-full truncate text-2xl font-bold leading-tight outline-none" style={{ color: props.orgColors.text }}>
            {title}
          </h2>
          <p className="mt-1 text-sm" style={{ color: props.orgColors.textSecondary }}>
            {getStandaloneSummary(courses, props.t)}
          </p>
        </div>
      </div>
      <div className="relative">
        <ScrollArrowButton ariaLabel={props.t('dashboard.learningPaths.previousCourses', 'Cursos anteriores')} direction="left" onClick={() => props.scrollPath(STANDALONE_PATH_ID, 'left')} orgColors={props.orgColors} />
        <StandaloneItemsRow courses={visibleCourses} items={items} standalonePathId={STANDALONE_PATH_ID} title={title} disableHeavyEffects={disableHeavyEffects} {...props} />
        <ScrollArrowButton ariaLabel={props.t('dashboard.learningPaths.nextCourses', 'Mas cursos')} direction="right" onClick={() => props.scrollPath(STANDALONE_PATH_ID, 'right')} orgColors={props.orgColors} />
      </div>
      {hasHiddenItems ? (
        <ShowMoreButton label={props.t('dashboard.learningPaths.showMoreCourses', 'Ver mas cursos')} onClick={() => props.showMorePathItems(STANDALONE_PATH_ID, courses.length)} orgColors={props.orgColors} />
      ) : null}
    </motion.section>
  )
}
