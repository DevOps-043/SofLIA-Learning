import { motion, type Transition } from 'framer-motion'
import { OnboardingVideoPlayer } from '@/features/courses/components/onboarding-video-player/OnboardingVideoPlayer'
import type { AssignedCourse, AssignedLearningPath } from '../../types'
import { getIntroFallback } from './intro-video.api'
import { LearningPathHeader } from './LearningPathHeader'
import { LearningPathItemsRow } from './LearningPathItemsRow'
import { ScrollArrowButton } from './ScrollArrowButton'
import { ShowMoreButton } from './ShowMoreButton'
import { getLearningPathCompletedSummary } from './summary'
import type {
  InfoHoverCardContent,
  IntroVideoState,
  LearningPathViewProps,
} from './types'

interface LearningPathSectionProps {
  assignedCoursesById: Map<string, AssignedCourse>
  disableHeavyEffects: boolean
  intro: IntroVideoState | undefined
  introLoadingFallback: boolean
  interfaceStaggerSeconds: number
  interfaceTransition: Transition
  learningPath: AssignedLearningPath
  onCertificateClick?: LearningPathViewProps['onCertificateClick']
  onCompleteTour: (pathId: string) => void
  onCourseClick: LearningPathViewProps['onCourseClick']
  onOpenCourse: LearningPathViewProps['onOpenCourse']
  onOpenTour: (pathId: string) => void
  onPreview: (anchor: HTMLElement, content: InfoHoverCardContent) => void
  onPreviewEnd: () => void
  orgColors: LearningPathViewProps['orgColors']
  pathIndex: number
  scrollPath: (pathId: string, direction: 'left' | 'right') => void
  setScrollerRef: (pathId: string, node: HTMLDivElement | null) => void
  showMorePathItems: (pathId: string, totalItems: number) => void
  t: LearningPathViewProps['t']
  visibleItemCount: number
}

export function LearningPathSection(props: LearningPathSectionProps) {
  const intro = props.intro ?? getIntroFallback(props.introLoadingFallback)
  const hasHiddenItems = props.visibleItemCount < props.learningPath.items.length
  const summary = getLearningPathCompletedSummary(props.learningPath, props.t)

  return (
    <motion.section
      key={props.learningPath.id}
      initial={props.disableHeavyEffects ? false : { opacity: 0, y: 12 }}
      animate={props.disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      transition={props.disableHeavyEffects ? undefined : {
        ...props.interfaceTransition,
        delay: Math.min(props.pathIndex * props.interfaceStaggerSeconds, 0.08),
      }}
    >
      <LearningPathHeader
        intro={intro}
        learningPath={props.learningPath}
        orgColors={props.orgColors}
        pathIndex={props.pathIndex}
        summary={summary}
        onOpenTour={() => props.onOpenTour(props.learningPath.id)}
        onPreview={props.onPreview}
        onPreviewEnd={props.onPreviewEnd}
        t={props.t}
      />
      <div className="relative">
        <ScrollArrowButton ariaLabel={props.t('dashboard.learningPaths.previousCourses', 'Cursos anteriores')} direction="left" onClick={() => props.scrollPath(props.learningPath.id, 'left')} orgColors={props.orgColors} />
        <LearningPathItemsRow {...props} />
        <ScrollArrowButton ariaLabel={props.t('dashboard.learningPaths.nextCourses', 'Mas cursos')} direction="right" onClick={() => props.scrollPath(props.learningPath.id, 'right')} orgColors={props.orgColors} />
      </div>
      {hasHiddenItems ? (
        <ShowMoreButton label={props.t('dashboard.learningPaths.showMoreCourses', 'Ver mas cursos')} onClick={() => props.showMorePathItems(props.learningPath.id, props.learningPath.items.length)} orgColors={props.orgColors} />
      ) : null}
      {intro.showPlayer && intro.introVideoUrl ? (
        <OnboardingVideoPlayer videos={[intro.introVideoUrl]} onComplete={() => props.onCompleteTour(props.learningPath.id)} />
      ) : null}
    </motion.section>
  )
}
