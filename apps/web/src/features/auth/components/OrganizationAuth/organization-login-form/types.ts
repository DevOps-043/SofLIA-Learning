import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import type { LoginFormData } from '../../../types/auth.types'
import type { useOrganizationAuthStyles } from '../useOrganizationAuthStyles'

export type OrganizationAuthPalette = ReturnType<
  typeof useOrganizationAuthStyles
>['palette']

export interface OrganizationLoginFieldProps {
  errors: FieldErrors<LoginFormData>
  focusedField: string | null
  isPending: boolean
  palette: OrganizationAuthPalette
  register: UseFormRegister<LoginFormData>
  setFocusedField: (field: string | null) => void
}

export interface OrganizationLoginOptionsProps {
  palette: OrganizationAuthPalette
  register: UseFormRegister<LoginFormData>
  rememberMe: boolean
  router: AppRouterInstance
}
