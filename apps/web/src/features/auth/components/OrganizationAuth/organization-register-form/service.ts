import type { RegisterFormData } from '../../../types/auth.types'

export const organizationRegisterRoleLabels: Record<string, string> = {
  owner: 'Propietario',
  admin: 'Administrador',
  member: 'Miembro',
}

export function createOrganizationRegisterDefaultValues(
  invitedEmail?: string | null,
): RegisterFormData {
  return {
    firstName: '',
    lastName: '',
    username: '',
    countryCode: 'MX',
    phoneNumber: '',
    email: invitedEmail || '',
    confirmEmail: invitedEmail || '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  }
}

export function buildOrganizationRegisterActionFormData(params: {
  data: RegisterFormData
  organizationId: string
  organizationSlug: string
  invitationToken?: string | null
  bulkInviteToken?: string | null
}): FormData {
  const formData = new FormData()

  Object.entries(params.data).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false')
      return
    }

    formData.append(key, String(value))
  })

  formData.append('organizationId', params.organizationId)
  formData.append('organizationSlug', params.organizationSlug)

  if (params.invitationToken) {
    formData.append('invitationToken', params.invitationToken)
  }

  if (params.bulkInviteToken) {
    formData.append('bulkInviteToken', params.bulkInviteToken)
  }

  return formData
}

export function getOrganizationRegisterRedirectPath(
  organizationSlug: string,
): string {
  return `/auth/${organizationSlug}`
}

export function getOrganizationRegisterRoleLabel(
  invitedRole?: string | null,
): string | null {
  if (!invitedRole) {
    return null
  }

  return organizationRegisterRoleLabels[invitedRole] || invitedRole
}
