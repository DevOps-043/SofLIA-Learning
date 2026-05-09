import { describe, expect, it } from 'vitest'

import { getExistingAccountInvitationLoginPath } from '../invitation-auth-routing.service'

describe('invitation auth routing service', () => {
  it('routes existing invited accounts to organization login with the invitation token', () => {
    expect(
      getExistingAccountInvitationLoginPath({
        accountExists: true,
        organizationSlug: 'acme',
        token: 'a'.repeat(64),
      }),
    ).toBe(`/auth/acme?invitation_token=${'a'.repeat(64)}`)
  })

  it('keeps new invited accounts on registration', () => {
    expect(
      getExistingAccountInvitationLoginPath({
        accountExists: false,
        organizationSlug: 'acme',
        token: 'a'.repeat(64),
      }),
    ).toBeNull()
  })
})
