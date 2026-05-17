export const REPORTS_ANALYTICS_UNSPECIFIED = 'unspecified'

export const REPORTS_ANALYTICS_AGE_BANDS = [
  'under_18',
  '18_24',
  '25_34',
  '35_44',
  '45_54',
  '55_plus',
  REPORTS_ANALYTICS_UNSPECIFIED,
] as const

export const REPORTS_ANALYTICS_PROGRESS_BANDS = [
  'not_started',
  'low',
  'medium',
  'high',
  'almost_done',
  'completed',
] as const

export const REPORTS_ANALYTICS_WEEKDAYS = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
] as const
