import type { OrganizationData } from '../../hooks/useBusinessSettings'

export interface PersonalizationTabProps {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
  saveSuccess: string | null
  setSaveSuccess: (msg: string | null) => void
  saveError: string | null
  setSaveError: (msg: string | null) => void
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
