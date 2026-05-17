export interface ReportsAnalyticsFilterOptions {
  courses: Array<{ value: string; label: string }>
  genders: Array<{ value: string; label: string }>
  ageBands: Array<{ value: string; label: string }>
  jobTitles: Array<{ value: string; label: string }>
  roles: Array<{ value: string; label: string }>
  statuses: Array<{ value: string; label: string }>
  regions: Array<{ value: string; label: string }>
  zones: Array<{ value: string; label: string; regionId?: string }>
  teams: Array<{ value: string; label: string; zoneId?: string; regionId?: string }>
}
