import { logger } from '@/lib/logger';

import type { ResolvedOAuthInvitationContext } from '../oauth-flow.types';
import {
  getMetadataPosition,
} from './helpers';
import type { ResolveOAuthInvitationContextInput, UserInvitationRow } from './types';
import { getTokenInvitationValidationError } from './token-validation';

export async function resolveTokenInvitationContext({
  email,
  orgContext,
  providerLabel,
  supabase,
}: ResolveOAuthInvitationContextInput): Promise<{
  error?: string;
  value?: Pick<ResolvedOAuthInvitationContext, 'invitedPosition' | 'invitedRole'>;
}> {
  const invitationToken = orgContext.invToken;
  if (!invitationToken) {
    return { error: 'Invitacion invalida o expirada' };
  }

  const { data: invitation, error } = await supabase
    .from('user_invitations')
    .select('id, email, role, status, expires_at, organization_id, metadata')
    .eq('token', invitationToken)
    .maybeSingle();

  const record = invitation as UserInvitationRow | null;

  if (error || !record) {
    logger.error(`${providerLabel} OAuth: Invitacion invalida`, error);
    return { error: 'Invitacion invalida o expirada' };
  }

  const errorMessage = await getTokenInvitationValidationError({
    email,
    orgId: orgContext.orgId,
    record,
    supabase,
  });

  if (errorMessage) {
    return { error: errorMessage };
  }

  return {
    value: {
      invitedPosition: getMetadataPosition(record.metadata),
      invitedRole: record.role,
    },
  };
}
