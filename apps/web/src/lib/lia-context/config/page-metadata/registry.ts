import type { PageMetadata } from './types';
import { businessPanelCoursesMetadata } from './routes/business-panel-courses/metadata';
import { businessPanelUsersMetadata } from './routes/business-panel-users/metadata';
import { businessUserDashboardMetadata } from './routes/business-user-dashboard/metadata';
import { businessUserAnalyticsMetadata } from './routes/business-user-analytics/metadata';
import { businessUserNotebookMetadata } from './routes/business-user-notebook/metadata';
import { businessUserNotebookEditorMetadata } from './routes/business-user-notebook-editor/metadata';
import { courseLearnMetadata } from './routes/course-learn/metadata';
import { businessPanelDashboardMetadata } from './routes/business-panel-dashboard/metadata';
import { businessPanelProgressMetadata } from './routes/business-panel-progress/metadata';
import { businessPanelReportsMetadata } from './routes/business-panel-reports/metadata';
import { businessPanelSettingsMetadata } from './routes/business-panel-settings/metadata';
import { businessPanelHierarchyMetadata } from './routes/business-panel-hierarchy/metadata';
import { adminDashboardMetadata } from './routes/admin-dashboard/metadata';
import { adminUsersMetadata } from './routes/admin-users/metadata';
import { adminCompaniesMetadata } from './routes/admin-companies/metadata';
import { adminReportesMetadata } from './routes/admin-reportes/metadata';
import { adminLiaAnalyticsMetadata } from './routes/admin-lia-analytics/metadata';
import { adminWorkshopsMetadata } from './routes/admin-workshops/metadata';
import { adminStatisticsMetadata } from './routes/admin-statistics/metadata';
import { adminUserStatsMetadata } from './routes/admin-user-stats/metadata';
import { adminAccessRequestsMetadata } from './routes/admin-access-requests/metadata';
import { authLoginMetadata } from './routes/auth-login/metadata';
import { authRegisterMetadata } from './routes/auth-register/metadata';
import { authForgotPasswordMetadata } from './routes/auth-forgot-password/metadata';
import { authResetPasswordMetadata } from './routes/auth-reset-password/metadata';
import { authSelectOrgMetadata } from './routes/auth-select-org/metadata';
import { userProfileMetadata } from './routes/user-profile/metadata';
import { accountSettingsMetadata } from './routes/account-settings/metadata';
import { certificatesListMetadata } from './routes/certificates-list/metadata';
import { certificateVerifyMetadata } from './routes/certificate-verify/metadata';
import { mainDashboardMetadata } from './routes/main-dashboard/metadata';
import { courseDetailMetadata } from './routes/course-detail/metadata';
import { instructorDashboardMetadata } from './routes/instructor-dashboard/metadata';
import { instructorCoursesMetadata } from './routes/instructor-courses/metadata';
import { instructorNewCourseMetadata } from './routes/instructor-new-course/metadata';
import { appsDirectoryMetadata } from './routes/apps-directory/metadata';
import { promptDirectoryMetadata } from './routes/prompt-directory/metadata';
import { onboardingWelcomeMetadata } from './routes/onboarding-welcome/metadata';
import { liaLandingMetadata } from './routes/lia-landing/metadata';

export const PAGE_METADATA_BY_ROUTE = {
  '/[orgSlug]/business-panel/courses': businessPanelCoursesMetadata,
  '/[orgSlug]/business-panel/users': businessPanelUsersMetadata,
  '/[orgSlug]/business-user/dashboard': businessUserDashboardMetadata,
  '/[orgSlug]/business-user/analytics': businessUserAnalyticsMetadata,
  '/[orgSlug]/business-user/notebook': businessUserNotebookMetadata,
  '/[orgSlug]/business-user/notebook/[noteId]': businessUserNotebookEditorMetadata,
  '/courses/[slug]/learn': courseLearnMetadata,
  '/[orgSlug]/business-panel/dashboard': businessPanelDashboardMetadata,
  '/[orgSlug]/business-panel/progress': businessPanelProgressMetadata,
  '/[orgSlug]/business-panel/reports': businessPanelReportsMetadata,
  '/[orgSlug]/business-panel/settings': businessPanelSettingsMetadata,
  '/[orgSlug]/business-panel/hierarchy': businessPanelHierarchyMetadata,
  '/admin/dashboard': adminDashboardMetadata,
  '/admin/users': adminUsersMetadata,
  '/admin/companies': adminCompaniesMetadata,
  '/admin/reportes': adminReportesMetadata,
  '/admin/lia-analytics': adminLiaAnalyticsMetadata,
  '/admin/workshops': adminWorkshopsMetadata,
  '/admin/statistics': adminStatisticsMetadata,
  '/admin/user-stats': adminUserStatsMetadata,
  '/admin/access-requests': adminAccessRequestsMetadata,
  '/auth': authLoginMetadata,
  '/auth/[slug]/register': authRegisterMetadata,
  '/auth/forgot-password': authForgotPasswordMetadata,
  '/auth/reset-password': authResetPasswordMetadata,
  '/auth/select-organization': authSelectOrgMetadata,
  '/profile': userProfileMetadata,
  '/account-settings': accountSettingsMetadata,
  '/certificates': certificatesListMetadata,
  '/certificates/verify': certificateVerifyMetadata,
  '/dashboard': mainDashboardMetadata,
  '/courses/[slug]': courseDetailMetadata,
  '/instructor/dashboard': instructorDashboardMetadata,
  '/instructor/courses': instructorCoursesMetadata,
  '/instructor/courses/new': instructorNewCourseMetadata,
  '/apps-directory': appsDirectoryMetadata,
  '/prompt-directory': promptDirectoryMetadata,
  '/welcome': onboardingWelcomeMetadata,
  '/conocer-lia': liaLandingMetadata,
} satisfies Record<string, PageMetadata>;
