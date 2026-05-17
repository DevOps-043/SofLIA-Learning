import { isExpired } from './helpers';
import type { BulkInviteLinkRow } from './types';

export function getBulkInviteValidationError(
  link: BulkInviteLinkRow,
  organizationId?: string
): string | null {
  if (link.organization_id !== organizationId) {
    return 'Este enlace de invitacion no es para esta organizacion';
  }

  if (link.status !== 'active') {
    return getInactiveBulkInviteMessage(link.status);
  }

  if (isExpired(link.expires_at)) {
    return 'Este enlace de invitacion ha expirado';
  }

  if (link.max_uses && (link.current_uses || 0) >= link.max_uses) {
    return 'Este enlace de invitacion ha alcanzado el limite de usos';
  }

  return null;
}

function getInactiveBulkInviteMessage(status: string): string {
  if (status === 'paused') {
    return 'Este enlace de invitacion esta pausado';
  }

  if (status === 'expired') {
    return 'Este enlace de invitacion ha expirado';
  }

  if (status === 'exhausted') {
    return 'Este enlace de invitacion ha alcanzado el limite de usos';
  }

  return 'Este enlace de invitacion no esta activo';
}
