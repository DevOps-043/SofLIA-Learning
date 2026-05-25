'use client'

import type { ResponsiveSmokeScenarioId } from './constants'
import { AdminDashboardScenario } from './scenarios/AdminDashboardScenario'
import { AdminUsersModalScenario } from './scenarios/AdminUsersModalScenario'
import { AdminWorkshopsScenario } from './scenarios/AdminWorkshopsScenario'
import { BusinessDashboardScenario } from './scenarios/BusinessDashboardScenario'
import { BusinessPublicScenario } from './scenarios/BusinessPublicScenario'
import { BusinessUnifiedPanelScenario } from './scenarios/BusinessUnifiedPanelScenario'
import { BusinessUsersModalScenario } from './scenarios/BusinessUsersModalScenario'
import { CourseManagementScenario } from './scenarios/CourseManagementScenario'
import { InstructorCourseManagementScenario } from './scenarios/InstructorCourseManagementScenario'
import { SelectOrganizationScenario } from './scenarios/SelectOrganizationScenario'

interface ResponsiveSmokeScenarioPageProps {
  scenario: ResponsiveSmokeScenarioId
}

export function ResponsiveSmokeScenarioPage({
  scenario,
}: ResponsiveSmokeScenarioPageProps) {
  switch (scenario) {
    case 'admin-dashboard':
      return <AdminDashboardScenario />
    case 'admin-workshops':
      return <AdminWorkshopsScenario />
    case 'course-management':
      return <CourseManagementScenario />
    case 'admin-users-modal':
      return <AdminUsersModalScenario />
    case 'business-dashboard':
      return <BusinessDashboardScenario />
    case 'business-unified-panel':
      return <BusinessUnifiedPanelScenario />
    case 'business-users-modal':
      return <BusinessUsersModalScenario />
    case 'instructor-course-management':
      return <InstructorCourseManagementScenario />
    case 'select-organization':
      return <SelectOrganizationScenario />
    case 'business-public':
      return <BusinessPublicScenario />
  }
}
