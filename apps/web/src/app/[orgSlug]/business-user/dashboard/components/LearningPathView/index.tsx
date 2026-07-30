'use client'

import { useMotionSafe } from '@/lib/utils/motion'
import { INITIAL_VISIBLE_PATH_ITEMS, STANDALONE_PATH_ID } from './constants'
import { LearningPathHoverLayer } from './LearningPathHoverLayer'
import { LearningPathSection } from './LearningPathSection'
import { StandaloneCoursesSection } from './StandaloneCoursesSection'
import type { LearningPathViewProps } from './types'
import { useIntroVideos } from './useIntroVideos'
import { useLearningPathCourses } from './useLearningPathCourses'
import { useLearningPathPreview } from './useLearningPathPreview'
import { usePathScroller } from './usePathScroller'
import { useVisiblePathItems } from './useVisiblePathItems'
import dashboardStyles from '../../page-components/BusinessUserDashboard.module.css'

export function LearningPathView({
  learningPaths,
  assignedCourses,
  orgColors,
  orgSlug,
  onOpenCourse,
  onCourseClick,
  onCertificateClick,
  disableHeavyEffects = false,
  t,
}: LearningPathViewProps) {
  const { interfaceStaggerSeconds, interfaceTransition } = useMotionSafe()
  const {
    assignedCoursesById,
    learningPathIdKey,
    standaloneCourses,
    standaloneItems,
  } = useLearningPathCourses({ assignedCourses, learningPaths })
  const { visibleItemsByPath, showMorePathItems } = useVisiblePathItems(
    learningPaths,
    standaloneItems.length,
  )
  const { introByPath, openTour, completeTour } = useIntroVideos(orgSlug, learningPathIdKey)
  const { scrollPath, setScrollerRef } = usePathScroller()
  const preview = useLearningPathPreview(orgSlug, t)

  if (learningPaths.length === 0 && standaloneCourses.length === 0) {
    return null
  }

  return (
    <div
      data-tour-id="business-user-dashboard--learning-paths"
      className={dashboardStyles.learningPaths}
    >
      {learningPaths.map((learningPath, pathIndex) => (
        <LearningPathSection
          key={learningPath.id}
          assignedCoursesById={assignedCoursesById}
          disableHeavyEffects={disableHeavyEffects}
          intro={introByPath[learningPath.id]}
          introLoadingFallback={Boolean(orgSlug)}
          interfaceStaggerSeconds={interfaceStaggerSeconds}
          interfaceTransition={interfaceTransition}
          learningPath={learningPath}
          onCertificateClick={onCertificateClick}
          onCompleteTour={completeTour}
          onCourseClick={onCourseClick}
          onOpenCourse={onOpenCourse}
          onOpenTour={openTour}
          onPreview={preview.showPreview}
          onPreviewEnd={preview.scheduleHidePreview}
          orgColors={orgColors}
          pathIndex={pathIndex}
          scrollPath={scrollPath}
          setScrollerRef={setScrollerRef}
          showMorePathItems={showMorePathItems}
          t={t}
          visibleItemCount={visibleItemsByPath[learningPath.id] ?? Math.min(INITIAL_VISIBLE_PATH_ITEMS, learningPath.items.length)}
        />
      ))}
      {standaloneCourses.length > 0 ? (
        <StandaloneCoursesSection
          courses={standaloneCourses}
          disableHeavyEffects={disableHeavyEffects}
          interfaceStaggerSeconds={interfaceStaggerSeconds}
          interfaceTransition={interfaceTransition}
          items={standaloneItems}
          learningPathCount={learningPaths.length}
          onCertificateClick={onCertificateClick}
          onCourseClick={onCourseClick}
          onPreview={preview.showPreview}
          onPreviewEnd={preview.scheduleHidePreview}
          orgColors={orgColors}
          scrollPath={scrollPath}
          setScrollerRef={setScrollerRef}
          showMorePathItems={showMorePathItems}
          t={t}
          visibleItemCount={visibleItemsByPath[STANDALONE_PATH_ID]}
        />
      ) : null}
      <LearningPathHoverLayer
        card={preview.hoverCard}
        orgColors={orgColors}
        onMouseEnter={preview.clearHoverHideTimeout}
        onMouseLeave={preview.scheduleHidePreview}
        onClose={preview.closePreview}
        t={t}
      />
    </div>
  )
}
