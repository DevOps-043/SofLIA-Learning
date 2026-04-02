'use client';

import { UnifiedInviteModal } from '../../../shared/components/unified-invite-modal';
import { useAdminUnifiedInviteModalLogic } from '../hooks/useAdminUnifiedInviteModalLogic';

interface AdminUnifiedInviteModalProps {
  accentColor?: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
  onLinkCreated?: () => void;
  organizationId: string;
  organizationSlug?: string;
  primaryColor?: string;
}

export function AdminUnifiedInviteModal({
  accentColor,
  isOpen,
  onClose,
  onInviteSent,
  onLinkCreated,
  organizationId,
  primaryColor,
}: AdminUnifiedInviteModalProps) {
  const { theme, ...controller } = useAdminUnifiedInviteModalLogic({
    accentColor,
    isOpen,
    onClose,
    onInviteSent,
    onLinkCreated,
    organizationId,
    primaryColor,
  });

  return (
    <UnifiedInviteModal
      controller={controller}
      isOpen={isOpen}
      onClose={onClose}
      theme={theme}
    />
  );
}
