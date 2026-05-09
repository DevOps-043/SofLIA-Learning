import { describe, expect, it } from 'vitest'

import {
  getInvitationErrorTranslationKey,
  getInvitationRoleTranslationKey,
} from '../invitation-i18n.service'

describe('invitation i18n service', () => {
  it('maps stable invite reasons to translation keys', () => {
    expect(getInvitationErrorTranslationKey({ reason: 'expired' })).toBe(
      'auth.invitation.errors.expired',
    )
    expect(getInvitationErrorTranslationKey({ reason: 'exhausted' })).toBe(
      'auth.invitation.errors.exhausted',
    )
  })

  it('maps legacy Spanish errors to translation keys', () => {
    expect(
      getInvitationErrorTranslationKey({
        error: 'Esta invitacion ya fue utilizada',
      }),
    ).toBe('auth.invitation.errors.used')

    expect(
      getInvitationErrorTranslationKey({
        error: 'Este enlace de invitación no es para esta organización',
      }),
    ).toBe('auth.invitation.errors.wrongOrganization')
  })

  it('falls back to generic invalid invitation keys', () => {
    expect(getInvitationErrorTranslationKey({ error: 'unexpected' })).toBe(
      'auth.invitation.errors.invalid',
    )
  })

  it('returns translated role keys for known invitation roles', () => {
    expect(getInvitationRoleTranslationKey('owner')).toBe('auth.roles.owner')
    expect(getInvitationRoleTranslationKey('member')).toBe('auth.roles.member')
    expect(getInvitationRoleTranslationKey('custom')).toBe('custom')
  })
})
