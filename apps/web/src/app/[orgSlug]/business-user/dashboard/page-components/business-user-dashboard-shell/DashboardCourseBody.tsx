import { CourseGridView } from './CourseGridView'
import { CourseListView } from './CourseListView'
import { EmptyCoursesState } from './EmptyCoursesState'
import { LearningPathView } from './dynamic-components'
import type { DashboardCoursesSectionProps } from './course-section-types'

interface DashboardCourseBodyProps extends DashboardCoursesSectionProps {
  showListView: boolean
}

export function DashboardCourseBody(props: DashboardCourseBodyProps) {
  if (props.showLearningPathCarousel) {
    return (
      <LearningPathView
        learningPaths={props.learningPaths}
        assignedCourses={props.assignedCourses}
        orgColors={props.orgColors}
        orgSlug={props.orgSlug ?? ''}
        onOpenCourse={props.handleLearningPathCourseClick}
        onCourseClick={props.handleCourseClick}
        onCertificateClick={(course) => props.handleCourseClick(course, 'certificate')}
        disableHeavyEffects={props.disableHeavyEffects}
        t={props.t}
      />
    )
  }

  if (props.assignedCourses.length === 0) {
    return (
      <EmptyCoursesState
        disableHeavyEffects={props.disableHeavyEffects}
        interfaceTransition={props.interfaceTransition}
        orgColors={props.orgColors}
        t={props.t}
      />
    )
  }

  if (props.showListView) {
    return (
      <CourseListView
        assignedCourses={props.assignedCourses}
        collapsedGroups={props.collapsedGroups}
        disableHeavyEffects={props.disableHeavyEffects}
        groupedListSections={props.groupedListSections}
        handleCourseClick={props.handleCourseClick}
        handleLearningPathCourseClick={props.handleLearningPathCourseClick}
        interfaceTransition={props.interfaceTransition}
        onToggleGroup={props.onToggleGroup}
        orgColors={props.orgColors}
        t={props.t}
        userDashboardStyles={props.userDashboardStyles}
      />
    )
  }

  return (
    <CourseGridView
      assignedCourses={props.assignedCourses}
      coursePathMap={props.coursePathMap}
      disableHeavyEffects={props.disableHeavyEffects}
      displayedCourses={props.displayedCourses}
      handleCourseClick={props.handleCourseClick}
      orgColors={props.orgColors}
      orgSlug={props.orgSlug}
      t={props.t}
      userDashboardStyles={props.userDashboardStyles}
    />
  )
}
