import type { LucideIcon } from 'lucide-react';
import type { Dispatch, FormEvent, SetStateAction } from 'react';

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
  primaryColor: string;
  surfaceColor: string;
  textColor: string;
}

export interface UnifiedInviteModalController {
  actionLoading: string | null;
  bulkForm: BulkInviteForm;
  copied: boolean;
  copiedId: string | null;
  createdLink: UnifiedInviteLinkRecord | null;
  error: string | null;
  fetchLinks: () => Promise<void>;
  getInviteUrl: (token?: string) => string;
  getStatusConfig: (linkStatus: string) => InviteStatusConfig;
  handleBulkSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleCopy: () => Promise<void>;
  handleCopyLink: (link: UnifiedInviteLinkRecord) => Promise<void>;
  handleCreateAnother: () => void;
  handleIndividualSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleLinkAction: (
    linkId: string,
    action: 'delete' | 'pause' | 'resume'
  ) => Promise<void>;
  individualForm: IndividualInviteForm;
  isLoadingLinks: boolean;
  links: UnifiedInviteLinkRecord[];
  linksError: string | null;
  mode: InviteMode;
  openMenuId: string | null;
  roleLabels: Record<InviteRole, InviteRoleLabel>;
  setBulkForm: Dispatch<SetStateAction<BulkInviteForm>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setIndividualForm: Dispatch<SetStateAction<IndividualInviteForm>>;
  setLinksError: Dispatch<SetStateAction<string | null>>;
  setMode: Dispatch<SetStateAction<InviteMode>>;
  setOpenMenuId: Dispatch<SetStateAction<string | null>>;
  setStatus: Dispatch<SetStateAction<ModalStatus>>;
  status: ModalStatus;
  successEmail: string | null;
  t: InviteTranslate;
}

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
