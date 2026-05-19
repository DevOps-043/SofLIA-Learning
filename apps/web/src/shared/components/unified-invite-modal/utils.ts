import {
  AlertCircle,
  CheckCircle,
  Clock,
  Pause,
  XCircle,
} from 'lucide-react';
import type {
  BulkInviteForm,
  IndividualInviteForm,
  InviteRole,
  InviteStatusConfig,
  InviteTranslate,
  UnifiedInviteLinkRecord,
} from './types';

const DEFAULT_BULK_MAX_USES = 100;

type PartialInviteLinkRecord = Partial<UnifiedInviteLinkRecord> & {
  createdAt?: string;
  currentUses?: number;
  expiresAt?: string;
  maxUses?: number;
  usedCount?: number;
};

export function createDefaultExpiry(now = new Date()): string {
  const defaultExpiry = new Date(now);
  defaultExpiry.setDate(defaultExpiry.getDate() + 7);
  return defaultExpiry.toISOString().slice(0, 16);
}

export function createDefaultBulkInviteForm(now = new Date()): BulkInviteForm {
  return {
    expiresAt: createDefaultExpiry(now),
    maxUses: DEFAULT_BULK_MAX_USES,
    name: '',
    role: 'member',
  };
}

export function createDefaultIndividualInviteForm(): IndividualInviteForm {
  return {
    customMessage: '',
    email: '',
    position: '',
    role: 'member',
  };
}

export function buildInviteRoleLabels(
  t: InviteTranslate
): Record<InviteRole, { desc: string; label: string }> {
  return {
    admin: {
      desc: t(
        'users.modals.invite.roleDesc.admin',
        'Puede gestionar usuarios y contenido'
      ),
      label: t('users.roles.admin', 'Administrador'),
    },
    member: {
      desc: t(
        'users.modals.invite.roleDesc.member',
        'Acceso basico a la plataforma'
      ),
      label: t('users.roles.member', 'Miembro'),
    },
    owner: {
      desc: t(
        'users.modals.invite.roleDesc.owner',
        'Control total de la organizacion'
      ),
      label: t('users.roles.owner', 'Propietario'),
    },
  };
}

export function normalizeInviteLinkRecord(
  rawLink: PartialInviteLinkRecord
): UnifiedInviteLinkRecord {
  return {
    created_at: rawLink.created_at ?? rawLink.createdAt ?? '',
    current_uses:
      rawLink.current_uses ?? rawLink.currentUses ?? rawLink.usedCount ?? 0,
    expires_at: rawLink.expires_at ?? rawLink.expiresAt ?? '',
    id: rawLink.id ?? '',
    max_uses: rawLink.max_uses ?? rawLink.maxUses ?? 0,
    name: rawLink.name ?? null,
    role: rawLink.role ?? 'member',
    status: rawLink.status ?? 'active',
    token: rawLink.token ?? '',
  };
}

export function normalizeInviteLinkRecords(
  rawLinks: PartialInviteLinkRecord[] | null | undefined
): UnifiedInviteLinkRecord[] {
  return (rawLinks ?? []).map(normalizeInviteLinkRecord);
}

export function buildInviteStatusConfig(
  t: InviteTranslate,
  linkStatus: string,
  mutedText: string,
  inputBg: string
): InviteStatusConfig {
  switch (linkStatus) {
    case 'active':
      return {
        bgColor: 'rgba(34, 197, 94, 0.1)',
        color: 'var(--color-legacy-22c55e)',
        icon: CheckCircle,
        label: t('users.modals.manageLinks.status.active', 'Activo'),
      };
    case 'paused':
      return {
        bgColor: 'rgba(245, 158, 11, 0.1)',
        color: 'var(--color-warning)',
        icon: Pause,
        label: t('users.modals.manageLinks.status.paused', 'Pausado'),
      };
    case 'expired':
      return {
        bgColor: 'rgba(239, 68, 68, 0.1)',
        color: 'var(--color-error)',
        icon: Clock,
        label: t('users.modals.manageLinks.status.expired', 'Expirado'),
      };
    case 'exhausted':
      return {
        bgColor: 'rgba(107, 114, 128, 0.1)',
        color: 'var(--color-legacy-6b7280)',
        icon: XCircle,
        label: t('users.modals.manageLinks.status.exhausted', 'Agotado'),
      };
    default:
      return {
        bgColor: inputBg,
        color: mutedText,
        icon: AlertCircle,
        label: linkStatus,
      };
  }
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text || typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
