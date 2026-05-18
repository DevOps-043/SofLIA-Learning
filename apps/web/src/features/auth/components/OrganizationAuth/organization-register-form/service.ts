import type { RegisterFormData } from '../../../types/auth.types'

export const organizationRegisterRoleTranslationKeys: Record<string, string> = {
  owner: 'auth.roles.owner',
  admin: 'auth.roles.admin',
  member: 'auth.roles.member',
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
    dateOfBirth: '',
    gender: null,
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
  captchaToken?: string
}): FormData {
  const formData = new FormData()

  Object.entries(params.data).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      formData.append(key, value ? 'true' : 'false')
      return
    }

    if (value === null || value === undefined) {
      formData.append(key, '')
      return
    }

    formData.append(key, String(value))
  })

  formData.append('organizationId', params.organizationId)
  formData.append('organizationSlug', params.organizationSlug)
  formData.append('captchaToken', params.captchaToken ?? '')

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

export function getOrganizationRegisterRoleTranslationKey(
  invitedRole?: string | null,
): string | null {
  if (!invitedRole) {
    return null
  }

  return organizationRegisterRoleTranslationKeys[invitedRole] || invitedRole
}
