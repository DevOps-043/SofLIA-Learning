import type { CSSProperties } from 'react'
import type { ToastType } from '@/core/components/ToastNotification/ToastNotification'
import type { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import type { BrandingData, BrandingUpdateResult } from '../../hooks/useBranding'
import type { OrganizationData } from '../../hooks/useBusinessSettings'
import type { useOrgFormState } from '../useOrgFormState'

export type OrganizationTabTheme = ReturnType<typeof useBusinessPanelTheme>
export type OrganizationFormState = ReturnType<typeof useOrgFormState>
export type OrganizationTheme = OrganizationTabTheme

export interface OrganizationSectionProps {
  form: OrganizationFormState
  theme: OrganizationTabTheme
}

export interface OrganizationTabProps {
  organization: OrganizationData | null
  updateOrganization: (data: Partial<OrganizationData>) => Promise<boolean>
  branding: BrandingData | null
  updateBranding: (data: Partial<BrandingData>) => Promise<BrandingUpdateResult>
  showToast: (msg: string, type?: ToastType) => void
}

export interface OrganizationTabStyles {
  cardStyle: CSSProperties
  helpStyle: CSSProperties
  inputStyle: CSSProperties
  labelStyle: CSSProperties
  mutedStyle: CSSProperties
}
