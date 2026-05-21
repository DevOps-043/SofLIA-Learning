export const SHARED_TOUR_TARGET_IDS = {
  liaTrigger: 'lia-tour-trigger-stable',
} as const;

export const BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS = {
  heroSection: 'tour-hero-section',
  statsSection: 'tour-stats-section',
  statCourses: 'tour-stat-courses',
  statCertificates: 'tour-stat-certificates',
  statAnalytics: 'tour-stat-analytics',
  courseViewSwitcher: 'tour-course-view-switcher',
  courseViewGridButton: 'tour-course-view-grid-button',
  learningPathSection: 'tour-learning-path-section',
  learningPathIntroVideo: 'tour-learning-path-intro-video',
  userDropdownTrigger: 'tour-user-dropdown-trigger',
  userDropdownMenu: 'tour-user-dropdown-menu',
  mobileMenuTrigger: 'tour-mobile-menu-trigger',
  mobileMenuPanel: 'tour-mobile-menu-panel',
} as const;

export const COURSE_LEARN_TOUR_TARGET_IDS = {
  workspace: 'course-learn-workspace',
  sidebar: 'course-learn-sidebar',
  mobileMaterialButton: 'course-learn-mobile-material-button',
  videoPanel: 'course-learn-video-panel',
  tools: 'course-learn-tools',
  replayButton: 'course-learn-replay-button',
  liaTrigger: SHARED_TOUR_TARGET_IDS.liaTrigger,
  liaMobileTrigger: 'course-learn-lia-mobile-trigger',
} as const;

export const PROFILE_TOUR_TARGET_IDS = {
  hero: 'profile-tour-hero',
  avatar: 'profile-tour-avatar',
  summary: 'profile-tour-summary',
  stats: 'profile-tour-stats',
  tabs: 'profile-tour-tabs',
  personalForm: 'profile-tour-personal-form',
  securitySection: 'profile-tour-security-section',
} as const;

export const BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS = {
  header: 'business-user-analytics-tour-header',
  rangeControls: 'business-user-analytics-tour-range-controls',
  metrics: 'business-user-analytics-tour-metrics',
  courseProgress: 'business-user-analytics-tour-course-progress',
  aiAdoption: 'business-user-analytics-tour-ai-adoption',
  feedback: 'business-user-analytics-tour-feedback',
  heatmap: 'business-user-analytics-tour-heatmap',
} as const;

export const SELECT_ORGANIZATION_TOUR_TARGET_IDS = {
  header: 'select-organization-tour-header',
  counter: 'select-organization-tour-counter',
  grid: 'select-organization-tour-grid',
  card: 'select-organization-tour-card',
  role: 'select-organization-tour-role',
  action: 'select-organization-tour-action',
} as const;

export const NOTEBOOK_TOUR_TARGET_IDS = {
  toolbar: 'notebook-tour-toolbar',
  header: 'notebook-tour-header',
  tabs: 'notebook-tour-tabs',
  courseFilter: 'notebook-tour-course-filter',
  notesGrid: 'notebook-tour-notes-grid',
} as const;

export type CourseLearnTourTargetKey =
  keyof typeof COURSE_LEARN_TOUR_TARGET_IDS;

export type BusinessUserDashboardTourTargetKey =
  keyof typeof BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS;

export type ProfileTourTargetKey =
  keyof typeof PROFILE_TOUR_TARGET_IDS;

export type BusinessUserAnalyticsTourTargetKey =
  keyof typeof BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS;

export type SelectOrganizationTourTargetKey =
  keyof typeof SELECT_ORGANIZATION_TOUR_TARGET_IDS;

export type NotebookTourTargetKey =
  keyof typeof NOTEBOOK_TOUR_TARGET_IDS;

export function getBusinessUserDashboardTourTargetSelector(
  target: BusinessUserDashboardTourTargetKey,
): string {
  return `#${BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS[target]}`;
}

export function getCourseLearnTourTargetSelector(
  target: CourseLearnTourTargetKey,
): string {
  return `#${COURSE_LEARN_TOUR_TARGET_IDS[target]}`;
}

export function getProfileTourTargetSelector(
  target: ProfileTourTargetKey,
): string {
  return `#${PROFILE_TOUR_TARGET_IDS[target]}`;
}

export function getBusinessUserAnalyticsTourTargetSelector(
  target: BusinessUserAnalyticsTourTargetKey,
): string {
  return `#${BUSINESS_USER_ANALYTICS_TOUR_TARGET_IDS[target]}`;
}

export function getSelectOrganizationTourTargetSelector(
  target: SelectOrganizationTourTargetKey,
): string {
  return `#${SELECT_ORGANIZATION_TOUR_TARGET_IDS[target]}`;
}

export function getNotebookTourTargetSelector(
  target: NotebookTourTargetKey,
): string {
  return `#${NOTEBOOK_TOUR_TARGET_IDS[target]}`;
}
