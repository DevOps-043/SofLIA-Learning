import { describe, expect, it } from 'vitest'
import {
  buildOrganizationRegisterActionFormData,
  createOrganizationRegisterDefaultValues,
  getOrganizationRegisterRedirectPath,
  getOrganizationRegisterRoleLabel,
} from '../organization-register-form/service'

describe('organization register form service', () => {
  it('creates default values with invited email', () => {
    expect(createOrganizationRegisterDefaultValues('invited@example.com')).toMatchObject({
      email: 'invited@example.com',
      confirmEmail: 'invited@example.com',
      countryCode: 'MX',
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
        email: 'juan@example.com',
        confirmEmail: 'juan@example.com',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        acceptTerms: true,
      },
      organizationId: 'org-id',
      organizationSlug: 'acme',
      invitationToken: 'token-1',
      bulkInviteToken: 'bulk-1',
    })

    expect(formData.get('organizationId')).toBe('org-id')
    expect(formData.get('organizationSlug')).toBe('acme')
    expect(formData.get('acceptTerms')).toBe('true')
    expect(formData.get('invitationToken')).toBe('token-1')
    expect(formData.get('bulkInviteToken')).toBe('bulk-1')
  })

  it('returns role labels and redirect path', () => {
    expect(getOrganizationRegisterRoleLabel('admin')).toBe('Administrador')
    expect(getOrganizationRegisterRoleLabel('custom-role')).toBe('custom-role')
    expect(getOrganizationRegisterRedirectPath('acme')).toBe('/auth/acme')
  })
})
