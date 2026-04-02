import { describe, expect, it } from 'vitest'
import {
  buildForcedAuthRedirectUrl,
  buildOrganizationLoginActionFormData,
  formatRedirectCountdownMessage,
  isNextRedirectError,
} from '../organization-login-form/service'

describe('organization-login-form.service', () => {
  it('arma FormData con contexto organizacional e invitaciones', () => {
    const formData = buildOrganizationLoginActionFormData({
      data: {
        emailOrUsername: 'ada@test.com',
        password: 'secret',
        rememberMe: true,
      },
      organizationId: 'org-1',
      organizationSlug: 'soflia',
      invitationToken: 'invite-1',
      bulkInviteToken: 'bulk-1',
    })

    expect(formData.get('organizationId')).toBe('org-1')
    expect(formData.get('invitationToken')).toBe('invite-1')
    expect(formData.get('bulkInviteToken')).toBe('bulk-1')
  })

  it('normaliza redirects forzados a auth y countdown', () => {
    expect(buildForcedAuthRedirectUrl('/auth')).toBe('/auth?redirect=force')
    expect(buildForcedAuthRedirectUrl('/auth/tenant')).toBe(
      '/auth/tenant?redirect=force',
    )
    expect(formatRedirectCountdownMessage('Redirigiendo en 5 segundos', 3)).toBe(
      'Redirigiendo en 3 segundos',
    )
  })

  it('detecta errores NEXT_REDIRECT', () => {
    expect(isNextRedirectError({ digest: 'NEXT_REDIRECT;replace;/' })).toBe(true)
    expect(isNextRedirectError({ message: 'NEXT_REDIRECT' })).toBe(true)
    expect(isNextRedirectError(new Error('other'))).toBe(false)
  })
})
