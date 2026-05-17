import type { LucideIcon } from 'lucide-react';
import type { UnifiedInviteModalController } from './controller.types';

export type InviteMode = 'individual' | 'bulk' | 'manage';
export type ModalStatus = 'idle' | 'loading' | 'success' | 'error';
export type InviteRole = 'owner' | 'admin' | 'member';
export type InviteLinkStatus = 'active' | 'paused' | 'expired' | 'exhausted';

export type InviteTranslate = (
  key: string,
  defaultValue?: string,
  options?: unknown
) => string;

export interface IndividualInviteForm {
  customMessage: string;
  email: string;
  position: string;
  role: InviteRole;
}

export interface BulkInviteForm {
  expiresAt: string;
  maxUses: number;
  name: string;
  role: InviteRole;
}

export interface InviteRoleLabel {
  desc: string;
  label: string;
}

export interface UnifiedInviteLinkRecord {
  created_at: string;
  current_uses: number;
  expires_at: string;
  id: string;
  max_uses: number;
  name: string | null;
  role: string;
  status: InviteLinkStatus;
  token: string;
}

export interface InviteStatusConfig {
  bgColor: string;
  color: string;
  icon: LucideIcon;
  label: string;
}

export interface UnifiedInviteTheme {
  accentColor: string;
  borderColor: string;
  headerGradient: string;
  inputBg: string;
  isDark: boolean;
  menuBg: string;
  mutedText: string;
  onPrimaryColor: string;
  primaryColor: string;
  surfaceColor: string;
  textColor: string;
}

export type { UnifiedInviteModalController } from './controller.types';

export interface UnifiedInviteModalProps {
  controller: UnifiedInviteModalController;
  isOpen: boolean;
  onClose: () => void;
  theme: UnifiedInviteTheme;
}

export interface UseUnifiedInviteModalCoreOptions {
  inputBg: string;
  inviteLinksBasePath: string;
  isOpen: boolean;
  mutedText: string;
  onClose: () => void;
  onInviteSent?: () => void;
  onLinkCreated?: () => void;
  organizationId?: string;
  t: InviteTranslate;
}
