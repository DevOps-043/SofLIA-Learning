'use client'

import { useEffect } from 'react'

import { useTour } from '@/features/tours'
import { businessUserDashboardTour } from '@/features/tours/config/business-user-dashboard.tour'

import { BusinessUserDashboardError } from './page-components/BusinessUserDashboardError'
import { BusinessUserDashboardLoading } from './page-components/BusinessUserDashboardLoading'
import { BusinessUserDashboardShell } from './page-components/BusinessUserDashboardShell'
import { useBusinessUserDashboardPageLogic } from './hooks/useBusinessUserDashboardPageLogic'

export default function BusinessUserDashboardPage() {
  const logic = useBusinessUserDashboardPageLogic()
  const { restartTour, autoStartIfNeeded } = useTour(businessUserDashboardTour)

  useEffect(() => {
    if (!logic.loading && !logic.error) {
      return autoStartIfNeeded()
    }

    return undefined
  }, [autoStartIfNeeded, logic.error, logic.loading])

  if (logic.loading) {
    return (
      <BusinessUserDashboardLoading
        orgColors={logic.orgColors}
        title={logic.t('common.loading', 'Cargando...')}
        subtitle={logic.t('common.preparingExperience', 'Preparando tu experiencia...')}
      />
    )
  }

  if (logic.error) {
    return (
      <BusinessUserDashboardError
        orgColors={logic.orgColors}
        error={logic.error}
        onRetry={logic.loadDashboardData}
      />
    )
  }

  return (
    <>
      <BusinessUserDashboardShell
        orgSlug={logic.orgSlug}
        user={logic.user}
        organization={logic.organization}
        orgRole={logic.orgRole}
        userDashboardStyles={logic.userDashboardStyles}
        backgroundStyle={logic.backgroundStyle}
        cssVariables={logic.cssVariables}
        orgColors={logic.orgColors}
        displayName={logic.displayName}
        initials={logic.initials}
        myStats={logic.myStats}
        stats={logic.stats}
        assignedCourses={logic.assignedCourses}
        learningPaths={logic.learningPaths}
        handleProfileClick={logic.handleProfileClick}
        handleLogout={logic.handleLogout}
        handleCertificatesClick={logic.handleCertificatesClick}
        handleAnalyticsClick={logic.handleAnalyticsClick}
        handleNotebookClick={logic.handleNotebookClick}
        handleCourseClick={logic.handleCourseClick}
        handleLearningPathCourseClick={logic.handleLearningPathCourseClick}
        onRestartTour={restartTour}
        t={logic.translate}
        disableHeavyEffects={logic.disableHeavyEffects}
      />
    </>
  )
}
