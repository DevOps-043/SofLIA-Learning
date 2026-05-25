'use client'

import { SofliaJoyride as Joyride } from '@/features/tours/components/SofliaJoyride'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import { ReviewConfirmationModals } from './BusinessPendingCoursesPage/ReviewConfirmationModals'
import { ReviewEmptyState } from './BusinessPendingCoursesPage/ReviewEmptyState'
import { ReviewErrorState } from './BusinessPendingCoursesPage/ReviewErrorState'
import { ReviewFiltersPanel } from './BusinessPendingCoursesPage/ReviewFiltersPanel'
import { ReviewHeader } from './BusinessPendingCoursesPage/ReviewHeader'
import { ReviewLoadingState } from './BusinessPendingCoursesPage/ReviewLoadingState'
import { ReviewStatsGrid } from './BusinessPendingCoursesPage/ReviewStatsGrid'
import { CourseReviewGrid } from './BusinessPendingCoursesPage/CourseReviewGrid'
import { useBusinessPendingCoursesPage } from './BusinessPendingCoursesPage/useBusinessPendingCoursesPage'
import type { BusinessPendingCoursesPageProps } from './BusinessPendingCoursesPage/types'

export function BusinessPendingCoursesPage({
  basePath,
}: BusinessPendingCoursesPageProps) {
  const panelTheme = useBusinessPanelTheme()
  const page = useBusinessPendingCoursesPage()

  if (page.isLoading) {
    return <ReviewLoadingState />
  }

  if (page.error) {
    return <ReviewErrorState error={page.error} title={page.tReviews('errors.loadTitle')} />
  }

  return (
    <>
      {page.joyrideProps.run ? <Joyride {...page.joyrideProps} /> : null}
      <div className="space-y-8">
        <ReviewHeader
          title={page.tReviews('title')}
          subtitle={page.tReviews('subtitle')}
        />
        <ReviewStatsGrid counts={page.counts} tReviews={page.tReviews} />
        <ReviewFiltersPanel
          activeTab={page.activeTab}
          counts={page.counts}
          searchTerm={page.searchTerm}
          tReviews={page.tReviews}
          onSearchChange={page.setSearchTerm}
          onTabChange={page.setActiveTab}
        />
        {page.filteredCourses.length === 0 ? (
          <ReviewEmptyState activeTab={page.activeTab} tReviews={page.tReviews} />
        ) : (
          <CourseReviewGrid
            activeTab={page.activeTab}
            basePath={basePath}
            courses={page.filteredCourses}
            language={page.i18n.language}
            tReviews={page.tReviews}
            onApprove={page.setCourseToApprove}
            onDelete={page.setCourseToDelete}
            onReject={page.setCourseToReject}
          />
        )}
        <ReviewConfirmationModals
          activeTab={page.activeTab}
          courseToApprove={page.courseToApprove}
          courseToDelete={page.courseToDelete}
          courseToReject={page.courseToReject}
          tReviews={page.tReviews}
          onApprove={page.handleApprove}
          onDelete={page.handleDelete}
          onReject={page.handleReject}
          onApproveClose={() => page.setCourseToApprove(null)}
          onDeleteClose={() => page.setCourseToDelete(null)}
          onRejectClose={() => page.setCourseToReject(null)}
        />
      </div>
    </>
  )
}
