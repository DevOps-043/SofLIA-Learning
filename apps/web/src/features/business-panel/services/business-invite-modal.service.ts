export interface BusinessInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
  organizationId?: string;
  organizationSlug?: string;
  defaultTab?: 'individual' | 'bulk' | 'manage';
}

export type TabType = 'individual' | 'bulk' | 'manage';
export type InviteStatus = 'idle' | 'loading' | 'success' | 'error';
export type BusinessInviteRole = 'owner' | 'admin' | 'member';
export type BusinessInviteStatusIcon = 'check-circle' | 'pause' | 'clock' | 'x-circle' | 'alert-circle';

export interface BusinessInviteIndividualForm {
  email: string;
  role: BusinessInviteRole;
  position: string;
  customMessage: string;
}

export interface BusinessInviteBulkForm {
  name: string;
  maxUses: number;
  role: BusinessInviteRole;
  expiresAt: string;
}

export interface BulkInviteLink {
  id: string;
  token: string;
  name: string | null;
  max_uses: number;
  current_uses: number;
  role: string;
  expires_at: string;
  status: 'active' | 'paused' | 'expired' | 'exhausted';
  created_at: string;
}

export interface CreatedLink {
  id: string;
  token: string;
  name: string | null;
  max_uses: number;
  role: string;
  expires_at: string;
}

export interface BusinessInviteStatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: BusinessInviteStatusIcon;
}

export interface BusinessInviteTabConfig {
  id: TabType;
  label: string;
  icon: 'Mail' | 'Link2' | 'Users';
  badge?: number;
}

export function getDefaultBusinessInviteExpiry(now = new Date()): string {
  const defaultExpiry = new Date(now);
  defaultExpiry.setDate(defaultExpiry.getDate() + 7);
  return defaultExpiry.toISOString().slice(0, 16);
}

export function getBusinessInviteUrl(origin: string, token: string): string {
  return `${origin}/invite/${token}`;
}

export function getBusinessInviteTabs(linkCount: number): BusinessInviteTabConfig[] {
  return [
    { id: 'individual', label: 'Invitacion Individual', icon: 'Mail' },
    { id: 'bulk', label: 'Crear Enlace Masivo', icon: 'Link2' },
    { id: 'manage', label: 'Administrar Enlaces', icon: 'Users', badge: linkCount > 0 ? linkCount : undefined },
  ];
}

export function getBusinessInviteStatusConfig(
  status: string,
  fallbackColor: string,
  fallbackBgColor: string
): BusinessInviteStatusConfig {
  switch (status) {
    case 'active':
      return { label: 'Activo', color: 'var(--color-legacy-22c55e)', bgColor: 'rgba(34, 197, 94, 0.1)', icon: 'check-circle' };
    case 'paused':
      return { label: 'Pausado', color: 'var(--color-warning)', bgColor: 'rgba(245, 158, 11, 0.1)', icon: 'pause' };
    case 'expired':
      return { label: 'Expirado', color: 'var(--color-error)', bgColor: 'rgba(239, 68, 68, 0.1)', icon: 'clock' };
    case 'exhausted':
      return { label: 'Agotado', color: 'var(--color-legacy-6b7280)', bgColor: 'rgba(107, 114, 128, 0.1)', icon: 'x-circle' };
    default:
      return { label: status, color: fallbackColor, bgColor: fallbackBgColor, icon: 'alert-circle' };
  }
}
