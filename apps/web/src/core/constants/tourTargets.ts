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

export type CourseLearnTourTargetKey =
  keyof typeof COURSE_LEARN_TOUR_TARGET_IDS;

export type BusinessUserDashboardTourTargetKey =
  keyof typeof BUSINESS_USER_DASHBOARD_TOUR_TARGET_IDS;

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
