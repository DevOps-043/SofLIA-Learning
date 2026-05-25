import type { SupabaseServerClient } from '../oauth-flow.types';
import type { OrganizationRelation } from './types';

export function getMetadataPosition(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== 'object') {
    return undefined;
  }

  const value = (metadata as { position?: unknown }).position;

  return typeof value === 'string' ? value : undefined;
}

export function getOrganizationSlug(organization: unknown): string | undefined {
  if (!organization || typeof organization !== 'object') {
    return undefined;
  }

  const relation = organization as OrganizationRelation;

  return typeof relation.slug === 'string' ? relation.slug : undefined;
}

export function isExpired(dateValue?: string | null): boolean {
  if (!dateValue) {
    return false;
  }

  return new Date(dateValue) < new Date();
}

export async function markInvitationExpired(
  supabase: SupabaseServerClient,
  invitationId: string
): Promise<void> {
  await supabase
    .from('user_invitations')
    .update({ status: 'expired' })
    .eq('id', invitationId);
}
