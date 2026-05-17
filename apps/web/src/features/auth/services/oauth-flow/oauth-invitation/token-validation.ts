import type { SupabaseServerClient } from '../oauth-flow.types';
import { isExpired, markInvitationExpired } from './helpers';
import type { UserInvitationRow } from './types';

export async function getTokenInvitationValidationError(input: {
  email: string;
  orgId?: string;
  record: UserInvitationRow;
  supabase: SupabaseServerClient;
}): Promise<string | null> {
  if (input.record.status !== 'pending') {
    return 'Invitacion invalida o expirada';
  }

  if (isExpired(input.record.expires_at)) {
    await markInvitationExpired(input.supabase, input.record.id);
    return 'Esta invitacion ha expirado';
  }

  if (input.record.email?.toLowerCase() !== input.email.toLowerCase()) {
    return 'El email de tu cuenta no coincide con la invitacion';
  }

  if (input.record.organization_id !== input.orgId) {
    return 'Esta invitacion no es para esta organizacion';
  }

  return null;
}
