import { escapeIlikePattern } from '@/lib/supabase/ilike-escape';

import type { SupabaseServerClient } from '../oauth-flow.types';
import type { ExistingOrganizationMembershipRow } from './types';

export async function findExistingActiveMembership(
  supabase: SupabaseServerClient,
  organizationId: string,
  userId: string
): Promise<ExistingOrganizationMembershipRow | null> {
  const { data } = await supabase
    .from('organization_users')
    .select('id, role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return (data as ExistingOrganizationMembershipRow | null) || null;
}

export async function consumeInvitation(
  supabase: SupabaseServerClient,
  tokenOrEmail: string,
  organizationId: string
): Promise<void> {
  const isToken = tokenOrEmail.length === 64 && /^[a-f0-9]+$/i.test(tokenOrEmail);
  let query = supabase
    .from('user_invitations')
    .update({
      accepted_at: new Date().toISOString(),
      status: 'accepted',
    })
    .eq('organization_id', organizationId)
    .eq('status', 'pending');

  query = isToken
    ? query.eq('token', tokenOrEmail)
    : query.ilike('email', escapeIlikePattern(tokenOrEmail.trim()));

  await query;
}
