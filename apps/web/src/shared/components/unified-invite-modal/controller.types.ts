import type { Dispatch, FormEvent, SetStateAction } from 'react';
import type {
  BulkInviteForm,
  IndividualInviteForm,
  InviteMode,
  InviteRole,
  InviteRoleLabel,
  InviteStatusConfig,
  InviteTranslate,
  ModalStatus,
  UnifiedInviteLinkRecord,
} from './types';

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
