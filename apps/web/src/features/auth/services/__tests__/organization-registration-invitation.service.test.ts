import { describe, expect, it } from 'vitest'

import { resolveOrganizationRegistrationInvitationParams } from '../organization-registration-invitation.service'

describe('resolveOrganizationRegistrationInvitationParams', () => {
  it('resolves canonical individual invitation tokens', () => {
    const token = 'a'.repeat(64)

    expect(resolve(`token=${token}`)).toEqual({
      bulkInviteToken: null,
      hasInvalidToken: false,
      invitationToken: token,
    })
  })

  it.each(['bulk_token', 'invite'])(
    'preserves a bulk invitation provided as %s',
    (parameter) => {
      const token = 'W-cD5-AC8JWgJAgsBM_-zPBzZ7-iXCLN'

      expect(resolve(`${parameter}=${token}`)).toEqual({
        bulkInviteToken: token,
        hasInvalidToken: false,
        invitationToken: null,
      })
    },
  )

  it('supports the legacy individual invitation_token parameter', () => {
    const token = 'b'.repeat(64)

    expect(resolve(`invitation_token=${token}`)).toMatchObject({
      hasInvalidToken: false,
      invitationToken: token,
    })
  })

  it.each([
    'bulk_token=../dashboard',
    'invite=https%3A%2F%2Fattacker.example%2Finvite',
    'token=short',
  ])('rejects malformed bearer tokens: %s', (query) => {
    expect(resolve(query)).toMatchObject({
      bulkInviteToken: null,
      hasInvalidToken: true,
      invitationToken: null,
    })
  })
})

function resolve(query: string) {
  return resolveOrganizationRegistrationInvitationParams(
    new URLSearchParams(query),
  )
}
