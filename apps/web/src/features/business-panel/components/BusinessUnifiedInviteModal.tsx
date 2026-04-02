'use client';

import { UnifiedInviteModal } from '../../../shared/components/unified-invite-modal';
import { useBusinessUnifiedInviteModalLogic } from '../hooks/useBusinessUnifiedInviteModalLogic';

interface BusinessUnifiedInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
  onLinkCreated?: () => void;
  organizationId?: string;
  organizationSlug?: string;
}

export function BusinessUnifiedInviteModal(
  props: BusinessUnifiedInviteModalProps
) {
  const { theme, ...controller } = useBusinessUnifiedInviteModalLogic(props);

  return (
    <UnifiedInviteModal
      controller={controller}
      isOpen={props.isOpen}
      onClose={props.onClose}
      theme={theme}
    />
  );
}
