import { logger } from '@/lib/logger';

import type { ResolvedOAuthInvitationContext } from '../oauth-flow.types';
import {
  getMetadataPosition,
  isExpired,
  markInvitationExpired,
} from './helpers';
import type { ResolveOAuthInvitationContextInput, UserInvitationRow } from './types';

const NOT_INVITED_MESSAGE =
  'Tu correo no ha sido invitado a esta organizacion. Contacta al administrador para solicitar una invitacion.';

export async function resolveEmailInvitationContext({
  email,
  orgContext,
  providerLabel,
  supabase,
}: ResolveOAuthInvitationContextInput): Promise<{
  error?: string;
  value?: Pick<ResolvedOAuthInvitationContext, 'invitedPosition' | 'invitedRole'>;
}> {
  const organizationId = orgContext.orgId;
  if (!organizationId) {
    return { error: NOT_INVITED_MESSAGE };
  }

  const { data: invitation } = await supabase
    .from('user_invitations')
    .select('id, role, expires_at, metadata')
    .ilike('email', email.trim())
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .maybeSingle();

  const record = invitation as Pick<
    UserInvitationRow,
    'expires_at' | 'id' | 'metadata' | 'role'
  > | null;

  if (!record) {
    logger.error(`${providerLabel} OAuth: Email no invitado a la organizacion`);
    return { error: NOT_INVITED_MESSAGE };
  }

  if (isExpired(record.expires_at)) {
    await markInvitationExpired(supabase, record.id);
    return { error: 'La invitacion ha expirado' };
  }

  return {
    value: {
      invitedPosition: getMetadataPosition(record.metadata),
      invitedRole: record.role,
    },
  };
}
