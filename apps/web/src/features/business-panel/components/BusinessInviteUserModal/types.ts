import type { BusinessPanelThemeTokens } from '../../hooks/useBusinessPanelTheme';

export interface BusinessInviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
  organizationId?: string;
}

export type InviteStatus = 'idle' | 'loading' | 'success' | 'error';
export type InviteRole = 'owner' | 'admin' | 'member';

export interface InviteFormData {
  customMessage: string;
  email: string;
  position: string;
  role: InviteRole;
}

export interface InviteRoleLabel {
  desc: string;
  label: string;
}

export type BusinessInviteTheme = BusinessPanelThemeTokens;
