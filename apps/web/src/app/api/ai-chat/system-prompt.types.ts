export interface PageContext {
  pathname: string
  detectedArea: string
  description: string
  pageTitle?: string
  metaDescription?: string
  headings?: string[]
  mainText?: string
  platformContext?: string
  availableLinks?: string
  userContext?: {
    userType?: string
    rol?: string
    area?: string
    nivel?: string
    tamanoEmpresa?: string
    organizationName?: string
    isB2B?: boolean
    calendarConnected?: boolean
    calendarProvider?: string | null
    hasCalendarAnalyzed?: boolean
    hasRecommendedSchedules?: boolean
    targetDate?: string
    [key: string]: unknown
  } | null
}

export type SupportedLanguage = 'es' | 'en' | 'pt'
