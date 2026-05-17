import type { ResolvedOAuthInvitationContext } from '../oauth-flow.types';
import {
  getMetadataPosition,
  getOrganizationSlug,
  isExpired,
  markInvitationExpired,
} from './helpers';
import type {
  PendingInvitationLookupRow,
  UserInvitationRow,
} from './types';
import type { SupabaseServerClient } from '../oauth-flow.types';

export async function findPendingInvitationForGlobalLogin(
  supabase: SupabaseServerClient,
  email: string
): Promise<ResolvedOAuthInvitationContext> {
  const { data: invitations } = await supabase
    .from('user_invitations')
    .select('organization_id, role, metadata, organizations(slug), expires_at, id')
    .ilike('email', email.trim())
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1);

  const invitation = invitations?.[0] as
    | (PendingInvitationLookupRow & Pick<UserInvitationRow, 'expires_at' | 'id'>)
    | undefined;

  if (!invitation) {
    return { orgContext: {} };
  }

  if (isExpired(invitation.expires_at)) {
    await markInvitationExpired(supabase, invitation.id);
    return { orgContext: {} };
  }

  return {
    invitedPosition: getMetadataPosition(invitation.metadata),
    invitedRole: invitation.role,
    orgContext: {
      orgId: invitation.organization_id,
      orgSlug: getOrganizationSlug(invitation.organizations),
    },
  };
}
