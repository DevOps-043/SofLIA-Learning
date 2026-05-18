'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, useState } from 'react'

import { TeamRequiredBanner } from '@/features/business-panel/components/hierarchy/TeamRequiredBanner'
import { OnboardingVideoPlayer } from '@/features/tours/components/OnboardingVideoPlayer'
import { useMotionSafe } from '@/lib/utils/motion'

import { DashboardCoursesSection } from './business-user-dashboard-shell/DashboardCoursesSection'
import { DashboardHero } from './business-user-dashboard-shell/DashboardHero'
import { DashboardNavbar } from './business-user-dashboard-shell/DashboardNavbar'
import { DashboardStatsSection } from './business-user-dashboard-shell/DashboardStatsSection'
import { useDashboardCourseSections } from './business-user-dashboard-shell/useDashboardCourseSections'
import { useVisibleDashboardCourses } from './business-user-dashboard-shell/useVisibleDashboardCourses'
import type {
  BusinessUserDashboardShellProps,
  CourseViewMode,
} from './business-user-dashboard-shell/types'

export function BusinessUserDashboardShell(props: BusinessUserDashboardShellProps) {
  const { interfaceTransition } = useMotionSafe()
  const [courseView, setCourseView] = useState<CourseViewMode>('grid')
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  const { coursePathMap, groupedListSections } = useDashboardCourseSections(
    props.assignedCourses,
    props.learningPaths,
    props.t,
  )
  const { displayedCourses, showMoreCourses } = useVisibleDashboardCourses(
    props.assignedCourses,
    props.disableHeavyEffects,
  )
  const showLearningPathCarousel =
    props.learningPaths.length > 0 &&
    props.assignedCourses.length > 0 &&
    courseView === 'grid'

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    techDebtLogger.debug('[business-user-dashboard] initial cards', {
      disableHeavyEffects: props.disableHeavyEffects,
      renderedCards: displayedCourses.length,
      totalCourses: props.assignedCourses.length,
    })
  }, [props.assignedCourses.length, props.disableHeavyEffects, displayedCourses.length])

  return (
    <div
      className="min-h-screen"
      style={{
        ...props.cssVariables,
        background:
          props.backgroundStyle.background ||
          props.backgroundStyle.backgroundColor ||
          props.orgColors.sidebarBg,
      }}
    >
      <DashboardNavbar {...props} />
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${props.orgColors.primary}08 0%, transparent 50%)`,
          }}
        />
        <div className="mx-auto w-full max-w-[1920px] px-4 py-8 sm:px-6 lg:px-12 xl:px-16 2xl:px-20">
          <TeamRequiredBanner orgSlug={props.orgSlug} />
          <DashboardHero {...props} interfaceTransition={interfaceTransition} />
          <DashboardStatsSection {...props} interfaceTransition={interfaceTransition} />
          <DashboardCoursesSection
            {...props}
            collapsedGroups={collapsedGroups}
            coursePathMap={coursePathMap}
            courseView={courseView}
            displayedCourses={displayedCourses}
            groupedListSections={groupedListSections}
            interfaceTransition={interfaceTransition}
            onCourseViewChange={setCourseView}
            onLoadMoreCourses={showMoreCourses}
            onToggleGroup={(groupId) =>
              setCollapsedGroups((current) => ({
                ...current,
                [groupId]: !current[groupId],
              }))
            }
            showLearningPathCarousel={showLearningPathCarousel}
          />
        </div>
      </main>
      {props.showVideoIntro && props.introVideos.length > 0 ? (
        <OnboardingVideoPlayer
          videos={props.introVideos}
          onComplete={props.handleVideoComplete}
        />
      ) : null}
    </div>
  )
}
