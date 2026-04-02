import type { Dispatch, MutableRefObject, SetStateAction } from 'react'

export interface CreateCompanyData {
  name: string
  slug: string
  description: string
  contact_email: string
  contact_phone: string
  website_url: string
  subscription_plan: string
  max_users: number
  is_active: boolean
  brand_logo_url: string
  brand_banner_url: string
  brand_favicon_url: string
  brand_color_primary: string
  brand_color_secondary: string
  brand_color_accent: string
  brand_font_family: string
  google_login_enabled: boolean
  microsoft_login_enabled: boolean
  owner_email?: string
  owner_position?: string
}

export interface CreateModalProps {
  onClose: () => void
  onCreate: (data: CreateCompanyData) => Promise<void>
  isCreating: boolean
}

export interface PlanOption {
  value: string
  label: string
  color: string
  description: string
}

export type CreateTab = 'general' | 'branding' | 'owner'

export interface CreateCompanyModalState {
  activeTab: CreateTab
  formData: CreateCompanyData
  isPlanOpen: boolean
  uploadingLogo: boolean
  uploadingBanner: boolean
  logoInputRef: MutableRefObject<HTMLInputElement | null>
  bannerInputRef: MutableRefObject<HTMLInputElement | null>
  setActiveTab: Dispatch<SetStateAction<CreateTab>>
  setFormData: Dispatch<SetStateAction<CreateCompanyData>>
  setIsPlanOpen: Dispatch<SetStateAction<boolean>>
}
