import { logger } from '@/lib/logger';
import { createInvitationRepository } from '@/features/auth/actions/invitation/repository';
import { finalizeBulkInviteRegistration } from '@/features/auth/actions/invitation/invitation-redemption.service';

import { consumeInvitation } from './membership';
import type {
  LinkOAuthUserToOrganizationInput,
} from './types';

export async function linkOAuthUserToOrganization({
  bulkInviteLink,
  email,
  invitedPosition,
  invitedRole,
  orgContext,
  supabase,
  userId,
}: LinkOAuthUserToOrganizationInput): Promise<void> {
  if (!orgContext.orgId) {
    return;
  }

  const { data: membership } = await supabase
    .from('organization_users')
    .select('id')
    .eq('organization_id', orgContext.orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (membership) {
    return;
  }

  const { error: insertError } = await supabase.from('organization_users').insert({
    organization_id: orgContext.orgId,
    job_title: invitedPosition || 'Miembro',
    joined_at: new Date().toISOString(),
    role: invitedRole || 'member',
    status: 'active',
    user_id: userId,
  });

  if (insertError) {
    throw new Error('No se pudo vincular el usuario a la organizacion');
  }

  if (!bulkInviteLink) {
    await consumeInvitation(supabase, orgContext.invToken ?? email, orgContext.orgId);
    return;
  }

  const repository = createInvitationRepository(supabase);
  const usageResult = await finalizeBulkInviteRegistration(
    repository,
    bulkInviteLink.token,
    orgContext.orgId,
    userId,
  );

  if (usageResult.success) {
    return;
  }

  const { error: cleanupError } = await supabase
    .from('organization_users')
    .delete()
    .eq('organization_id', orgContext.orgId)
    .eq('user_id', userId);

  if (cleanupError) {
    logger.warn('OAuth invitation membership cleanup failed after bulk use error', {
      error: cleanupError.message,
      organizationId: orgContext.orgId,
      userId,
    });
  }

  throw new Error(usageResult.error || 'No se pudo consumir el enlace de invitacion');
}
