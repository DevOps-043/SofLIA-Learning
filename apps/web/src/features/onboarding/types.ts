export type OnboardingStatus = 'none' | 'pending_company' | 'pending_join' | 'approved' | 'rejected'

export type OnboardingType = 'company_created' | 'join_approved'

export interface OnboardingStatusResponse {
  success: boolean
  status: OnboardingStatus
  type?: OnboardingType
  organizationSlug?: string
  organizationName?: string
  error?: string
}

export interface CreateCompanyData {
  name: string
  contact_email: string
  contact_phone?: string
  description?: string
  website_url?: string
}

export interface JoinCompanyData {
  slug: string
  message?: string
  job_title?: string
}
