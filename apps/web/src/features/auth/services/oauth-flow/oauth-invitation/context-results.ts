import type { ResolvedOAuthInvitationContext } from '../oauth-flow.types';
import { resolveBulkInviteContext } from './bulk-invite';
import { resolveEmailInvitationContext } from './email-invitation';
import { resolveTokenInvitationContext } from './token-invitation';
import type { ResolveOAuthInvitationContextInput } from './types';

export async function resolveOrganizationBulkInvite(
  input: Omit<ResolveOAuthInvitationContextInput, 'email' | 'existingUserId'>
): Promise<{ error?: string; value?: ResolvedOAuthInvitationContext }> {
  const result = await resolveBulkInviteContext(input);

  if (result.error || !result.value) {
    return { error: result.error };
  }

  return {
    value: {
      orgContext: input.orgContext,
      ...result.value,
    },
  };
}

export async function resolveOrganizationTokenInvite(
  input: Omit<ResolveOAuthInvitationContextInput, 'existingUserId'>
): Promise<{ error?: string; value?: ResolvedOAuthInvitationContext }> {
  const result = await resolveTokenInvitationContext(input);

  if (result.error || !result.value) {
    return { error: result.error };
  }

  return {
    value: {
      orgContext: input.orgContext,
      ...result.value,
    },
  };
}

export async function resolveOrganizationEmailInvite(
  input: Omit<ResolveOAuthInvitationContextInput, 'existingUserId'>
): Promise<{ error?: string; value?: ResolvedOAuthInvitationContext }> {
  const result = await resolveEmailInvitationContext(input);

  if (result.error || !result.value) {
    return { error: result.error };
  }

  return {
    value: {
      orgContext: input.orgContext,
      ...result.value,
    },
  };
}
