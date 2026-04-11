export const responsiveSmokeScenarioIds = [
  'admin-dashboard',
  'admin-workshops',
  'course-management',
  'admin-users-modal',
  'business-dashboard',
  'business-reports',
  'business-users-modal',
  'instructor-course-management',
  'select-organization',
  'business-public',
] as const

export type ResponsiveSmokeScenarioId =
  (typeof responsiveSmokeScenarioIds)[number]

export const responsiveSmokeScenarioLabels: Record<
  ResponsiveSmokeScenarioId,
  string
> = {
  'admin-dashboard': 'Admin Dashboard',
  'admin-workshops': 'Admin Workshops',
  'course-management': 'Course Management',
  'admin-users-modal': 'Admin Users Modal',
  'business-dashboard': 'Business Dashboard',
  'business-reports': 'Business Reports',
  'business-users-modal': 'Business Users Modal',
  'instructor-course-management': 'Instructor Course Management',
  'select-organization': 'Select Organization',
  'business-public': 'Business Public',
}
