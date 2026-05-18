import { describe, expect, it } from 'vitest'
import {
  buildOrganizationRegisterActionFormData,
  createOrganizationRegisterDefaultValues,
  getOrganizationRegisterRedirectPath,
  getOrganizationRegisterRoleTranslationKey,
} from '../organization-register-form/service'

describe('organization register form service', () => {
  it('creates default values with invited email', () => {
    expect(createOrganizationRegisterDefaultValues('invited@example.com')).toMatchObject({
      email: 'invited@example.com',
      confirmEmail: 'invited@example.com',
      countryCode: 'MX',
      dateOfBirth: '',
      gender: null,
      acceptTerms: false,
    })
  })

  it('builds form data with organization and invitation context', () => {
    const formData = buildOrganizationRegisterActionFormData({
      data: {
        firstName: 'Juan',
        lastName: 'Perez',
        username: 'juanperez',
        countryCode: 'MX',
        phoneNumber: '5512345678',
        dateOfBirth: '1990-05-10',
        gender: 'female',
        email: 'juan@example.com',
        confirmEmail: 'juan@example.com',
        password: 'Password1234!',
        confirmPassword: 'Password1234!',
        acceptTerms: true,
      },
      organizationId: 'org-id',
      organizationSlug: 'acme',
      invitationToken: 'token-1',
      bulkInviteToken: 'bulk-1',
    })

    expect(formData.get('organizationId')).toBe('org-id')
    expect(formData.get('organizationSlug')).toBe('acme')
    expect(formData.get('dateOfBirth')).toBe('1990-05-10')
    expect(formData.get('gender')).toBe('female')
    expect(formData.get('acceptTerms')).toBe('true')
    expect(formData.get('invitationToken')).toBe('token-1')
    expect(formData.get('bulkInviteToken')).toBe('bulk-1')
  })

  it('returns role labels and redirect path', () => {
    expect(getOrganizationRegisterRoleTranslationKey('admin')).toBe('auth.roles.admin')
    expect(getOrganizationRegisterRoleTranslationKey('custom-role')).toBe('custom-role')
    expect(getOrganizationRegisterRedirectPath('acme')).toBe('/auth/acme')
  })
})
