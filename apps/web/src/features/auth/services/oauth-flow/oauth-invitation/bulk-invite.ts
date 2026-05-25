import { logger } from '@/lib/logger';
import { fromLoose } from '@/lib/supabase/looseQuery';

import type { ResolvedOAuthInvitationContext } from '../oauth-flow.types';
import type { BulkInviteLinkRow, ResolveOAuthInvitationContextInput } from './types';
import { getBulkInviteValidationError } from './bulk-invite-validation';

export async function resolveBulkInviteContext({
  orgContext,
  providerLabel,
  supabase,
}: Omit<ResolveOAuthInvitationContextInput, 'email'>): Promise<{
  error?: string;
  value?: Pick<ResolvedOAuthInvitationContext, 'bulkInviteLink' | 'invitedRole'>;
}> {
  const bulkToken = orgContext.bulkToken;
  if (!bulkToken) {
    return { error: 'Enlace de invitacion invalido o no encontrado' };
  }

  const { data: bulkInviteLink, error } = await fromLoose<BulkInviteLinkRow>(
    supabase,
    'bulk_invite_links'
  )
    .select('id, organization_id, role, status, expires_at, max_uses, current_uses')
    .eq('token', bulkToken)
    .maybeSingle();

  const link = bulkInviteLink as BulkInviteLinkRow | null;

  if (error || !link) {
    logger.error(`${providerLabel} OAuth: Enlace de invitacion no encontrado`, error);
    return { error: 'Enlace de invitacion invalido o no encontrado' };
  }

  const validationError = getBulkInviteValidationError(link, orgContext.orgId);
  if (validationError) {
    return { error: validationError };
  }

  return {
    value: {
      bulkInviteLink: {
        currentUses: link.current_uses || 0,
        id: link.id,
        organizationId: link.organization_id,
        role: link.role || 'member',
      },
      invitedRole: link.role || 'member',
    },
  };
}
