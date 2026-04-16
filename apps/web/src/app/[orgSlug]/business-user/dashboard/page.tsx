'use client'

import Joyride from 'react-joyride'
import { BusinessUserDashboardError } from './page-components/BusinessUserDashboardError'
import { BusinessUserDashboardLoading } from './page-components/BusinessUserDashboardLoading'
import { BusinessUserDashboardShell } from './page-components/BusinessUserDashboardShell'
import { useBusinessUserDashboardPageLogic } from './hooks/useBusinessUserDashboardPageLogic'

export default function BusinessUserDashboardPage() {
  const logic = useBusinessUserDashboardPageLogic()

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
        currentTime={logic.currentTime}
        language={logic.i18n.language}
        greeting={logic.greeting}
        displayName={logic.displayName}
        initials={logic.initials}
        myStats={logic.myStats}
        stats={logic.stats}
        assignedCourses={logic.assignedCourses}
        learningPaths={logic.learningPaths}
        restartTour={logic.restartTour}
        handleProfileClick={logic.handleProfileClick}
        handleLogout={logic.handleLogout}
        handleCertificatesClick={logic.handleCertificatesClick}
        handleCourseClick={logic.handleCourseClick}
        handleLearningPathCourseClick={logic.handleLearningPathCourseClick}
        showVideoIntro={logic.showVideoIntro}
        handleVideoComplete={logic.handleVideoComplete}
        introVideos={logic.introVideos}
        t={logic.translate}
      />
      {logic.isMounted && <Joyride {...logic.joyrideProps} />}
    </>
  )
}
