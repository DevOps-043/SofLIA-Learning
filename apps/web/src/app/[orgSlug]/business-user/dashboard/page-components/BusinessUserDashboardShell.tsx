'use client'

import { logger as techDebtLogger } from '@/lib/utils/logger'
import { useEffect, useState, type CSSProperties } from 'react'

import { TeamRequiredBanner } from '@/features/business-panel/components/hierarchy/TeamRequiredBanner'
import { useMotionSafe } from '@/lib/utils/motion'

import { DashboardCoursesSection } from './business-user-dashboard-shell/DashboardCoursesSection'
import { DashboardHero } from './business-user-dashboard-shell/DashboardHero'
import { DashboardNavbar } from './business-user-dashboard-shell/DashboardNavbar'
import { useDashboardCourseSections } from './business-user-dashboard-shell/useDashboardCourseSections'
import { useVisibleDashboardCourses } from './business-user-dashboard-shell/useVisibleDashboardCourses'
import styles from './BusinessUserDashboard.module.css'
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
  const dashboardStyles = {
    ...props.cssVariables,
    backgroundColor: props.orgColors.sidebarBg,
    ...props.backgroundStyle,
    '--dashboard-primary': props.orgColors.primary,
    '--dashboard-accent': props.orgColors.accent,
    '--dashboard-on-action': props.orgColors.onPrimary,
    '--dashboard-text': props.orgColors.text,
    '--dashboard-muted': props.orgColors.textSecondary,
    '--dashboard-surface': props.orgColors.cardBg,
    '--dashboard-canvas': props.orgColors.sidebarBg,
    '--dashboard-border': props.orgColors.border,
  } as CSSProperties

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
      data-tour-id="business-user-dashboard--page"
      className={styles.page}
      style={dashboardStyles}
    >
      <DashboardNavbar {...props} />
      <main className={styles.main}>
        <div className={styles.shell}>
          <TeamRequiredBanner orgSlug={props.orgSlug} />
          <DashboardHero {...props} interfaceTransition={interfaceTransition} />
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
    </div>
  )
}
