import { CourseSectionHeader } from './CourseSectionHeader'
import { DashboardCourseBody } from './DashboardCourseBody'
import { LoadMoreCoursesButton } from './LoadMoreCoursesButton'
import type { DashboardCoursesSectionProps } from './course-section-types'

export function DashboardCoursesSection(props: DashboardCoursesSectionProps) {
  const hasCourses = props.assignedCourses.length > 0 || props.learningPaths.length > 0
  const showListView = props.courseView === 'list' && props.groupedListSections.length > 0
  const showLoadMore =
    props.disableHeavyEffects &&
    !props.showLearningPathCarousel &&
    !showListView &&
    props.displayedCourses.length < props.assignedCourses.length

  return (
    <section>
      <CourseSectionHeader
        courseView={props.courseView}
        disableHeavyEffects={props.disableHeavyEffects}
        hasCourses={hasCourses}
        interfaceTransition={props.interfaceTransition}
        onCourseViewChange={props.onCourseViewChange}
        orgColors={props.orgColors}
        t={props.t}
      />
      <DashboardCourseBody {...props} showListView={showListView} />
      {showLoadMore ? (
        <LoadMoreCoursesButton
          onClick={props.onLoadMoreCourses}
          orgColors={props.orgColors}
          t={props.t}
        />
      ) : null}
    </section>
  )
}
