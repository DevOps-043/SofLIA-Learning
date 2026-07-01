import type { OrganizationData } from '../../hooks/useBusinessSettings'

export interface PersonalizationTabProps {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
}

export interface PersonalizationTabState {
  baseUrl: string
  copiedLogin: boolean
  copiedRegister: boolean
  copyToClipboard: (text: string, type: 'login' | 'register') => void
  handleSaveSlug: () => Promise<void>
  handleSlugChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleToggleSSO: (provider: 'google' | 'microsoft', value: boolean) => Promise<void>
  isCheckingSlug: boolean
  isSaving: boolean
  isUpdatingGoogle: boolean
  isUpdatingMicrosoft: boolean
  loginUrl: string
  registerUrl: string
  slug: string
  slugAvailable: boolean | null
  slugError: string | null
}
