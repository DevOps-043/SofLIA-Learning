import type { ClipboardEventHandler, JSX } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'
import type { LucideIcon } from 'lucide-react'
import type { RegisterFormData } from '../../../types/auth.types'
import type { OrganizationAuthPalette } from '../organization-auth.styles'

export interface OrganizationRegisterFormProps {
  organizationId: string
  organizationSlug: string
  invitationToken?: string | null
  invitedEmail?: string | null
  invitedRole?: string | null
  bulkInviteToken?: string | null
  googleLoginEnabled?: boolean
  microsoftLoginEnabled?: boolean
}

export interface OrganizationRegisterFieldProps {
  id: keyof RegisterFormData | string
  label: string
  type: string
  placeholder: string
  registration: ReturnType<UseFormRegister<RegisterFormData>>
  palette: OrganizationAuthPalette
  error?: string
  icon?: LucideIcon
  disabled?: boolean
  readOnly?: boolean
  onPaste?: ClipboardEventHandler<HTMLInputElement>
  rightAdornment?: JSX.Element | null
  helperText?: string
  max?: string
}

export interface OrganizationRegisterIdentityFieldsProps {
  register: UseFormRegister<RegisterFormData>
  errors: FieldErrors<RegisterFormData>
  palette: OrganizationAuthPalette
  invitedEmail?: string | null
  invitedRole?: string | null
  invitedRoleLabel?: string | null
  bulkInviteToken?: string | null
  success?: string | null
}

export interface OrganizationRegisterCredentialsFieldsProps {
  register: UseFormRegister<RegisterFormData>
  errors: FieldErrors<RegisterFormData>
  palette: OrganizationAuthPalette
  selectedCountryCode: string
  dialCode: string
  onCountryChange: (code: string, dial: string) => void
}

export interface OrganizationRegisterActionsProps {
  register: UseFormRegister<RegisterFormData>
  errors: FieldErrors<RegisterFormData>
  palette: OrganizationAuthPalette
  isPending: boolean
  organizationId: string
  organizationSlug: string
  invitationToken?: string | null
  bulkInviteToken?: string | null
  googleLoginEnabled?: boolean
  microsoftLoginEnabled?: boolean
  onOpenLegalModal: () => void
}
