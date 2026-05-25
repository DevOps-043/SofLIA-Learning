import type { ResolvedOAuthInvitationContext } from '../oauth-flow.types';
import {
  resolveOrganizationBulkInvite,
  resolveOrganizationEmailInvite,
  resolveOrganizationTokenInvite,
} from './context-results';
import { findExistingActiveMembership } from './membership';
import { findPendingInvitationForGlobalLogin } from './pending-invitation';
import type { ResolveOAuthInvitationContextInput } from './types';

export async function resolveOAuthInvitationContext({
  email,
  existingUserId,
  orgContext,
  providerLabel,
  supabase,
}: ResolveOAuthInvitationContextInput): Promise<{
  error?: string;
  value?: ResolvedOAuthInvitationContext;
}> {
  if (!orgContext.orgId) {
    return {
      value: await findPendingInvitationForGlobalLogin(supabase, email),
    };
  }

  if (existingUserId) {
    const existingMembership = await findExistingActiveMembership(
      supabase,
      orgContext.orgId,
      existingUserId
    );

    if (existingMembership) {
      return {
        value: {
          invitedRole: existingMembership.role || 'member',
          orgContext,
        },
      };
    }
  }

  if (orgContext.bulkToken) {
    return resolveOrganizationBulkInvite({ orgContext, providerLabel, supabase });
  }

  if (orgContext.invToken) {
    return resolveOrganizationTokenInvite({
      email,
      orgContext,
      providerLabel,
      supabase,
    });
  }

  return resolveOrganizationEmailInvite({
    email,
    orgContext,
    providerLabel,
    supabase,
  });
}
