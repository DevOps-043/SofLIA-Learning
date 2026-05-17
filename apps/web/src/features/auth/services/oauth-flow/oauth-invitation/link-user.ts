import { fromLoose } from '@/lib/supabase/looseQuery';

import { consumeInvitation } from './membership';
import type {
  BulkInviteLinkRow,
  BulkInviteRegistrationInsert,
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

  if (bulkInviteLink) {
    await registerBulkInviteUse({ bulkInviteLink, supabase, userId });
    return;
  }

  await consumeInvitation(supabase, orgContext.invToken ?? email, orgContext.orgId);
}

async function registerBulkInviteUse(input: {
  bulkInviteLink: NonNullable<LinkOAuthUserToOrganizationInput['bulkInviteLink']>;
  supabase: LinkOAuthUserToOrganizationInput['supabase'];
  userId: string;
}) {
  await fromLoose<BulkInviteRegistrationInsert, BulkInviteRegistrationInsert>(
    input.supabase,
    'bulk_invite_registrations'
  ).insert({
    bulk_invite_link_id: input.bulkInviteLink.id,
    registered_at: new Date().toISOString(),
    user_id: input.userId,
  });

  await fromLoose<BulkInviteLinkRow>(input.supabase, 'bulk_invite_links')
    .update({ current_uses: input.bulkInviteLink.currentUses + 1 })
    .eq('id', input.bulkInviteLink.id);
}
