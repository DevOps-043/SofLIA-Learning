import { describe, expect, it } from 'vitest';
import { resolveOAuthInvitationContext } from '../oauth-invitation.service';

function createMembershipSupabaseStub(membership: unknown) {
  return {
    from(tableName: string) {
      if (tableName !== 'organization_users') {
        throw new Error(`Unexpected table lookup: ${tableName}`);
      }

      return {
        eq() {
          return this;
        },
        maybeSingle: async () => ({
          data: membership,
        }),
        select() {
          return this;
        },
      };
    },
  } as never;
}

describe('oauth-invitation.service', () => {
  it('allows organization SSO when the existing user is already an active member', async () => {
    await expect(
      resolveOAuthInvitationContext({
        email: 'ana@example.com',
        existingUserId: 'user-1',
        orgContext: {
          orgId: 'org-1',
          orgSlug: 'acme',
        },
        providerLabel: 'Google',
        supabase: createMembershipSupabaseStub({
          id: 'membership-1',
          role: 'admin',
        }),
      })
    ).resolves.toEqual({
      value: {
        invitedRole: 'admin',
        orgContext: {
          orgId: 'org-1',
          orgSlug: 'acme',
        },
      },
    });
  });
});
