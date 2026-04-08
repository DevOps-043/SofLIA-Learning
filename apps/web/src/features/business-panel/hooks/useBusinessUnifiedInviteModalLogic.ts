'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useBusinessPanelTheme } from './useBusinessPanelTheme'
import {
  useUnifiedInviteModalCore,
  type InviteTranslate,
  type UnifiedInviteTheme,
} from '../../../shared/components/unified-invite-modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
  onLinkCreated?: () => void;
  organizationId?: string;
  organizationSlug?: string;
}

export function useBusinessUnifiedInviteModalLogic({
  isOpen,
  onClose,
  onInviteSent,
  onLinkCreated,
  organizationId,
  organizationSlug,
}: Props) {
  const params = useParams();
  const orgSlug = organizationSlug || (params?.orgSlug as string | undefined);
  const { t } = useTranslation('business');
  const panelTheme = useBusinessPanelTheme()

  const theme: UnifiedInviteTheme = {
    accentColor: panelTheme.accentColor,
    borderColor: panelTheme.borderColor,
    headerGradient: 'transparent',
    inputBg: panelTheme.inputBg,
    isDark: panelTheme.isDark,
    menuBg: panelTheme.cardBg,
    mutedText: panelTheme.mutedTextColor,
    onPrimaryColor: panelTheme.onPrimaryColor,
    primaryColor: panelTheme.primaryColor,
    surfaceColor: panelTheme.panelBg,
    textColor: panelTheme.textColor,
  };

  const controller = useUnifiedInviteModalCore({
    inputBg: theme.inputBg,
    inviteLinksBasePath: orgSlug
      ? `/api/${orgSlug}/business/invite-links`
      : '/api/business/invite-links',
    isOpen,
    mutedText: theme.mutedText,
    onClose,
    onInviteSent,
    onLinkCreated,
    organizationId,
    t: t as unknown as InviteTranslate,
  });

  return { ...controller, theme };
}
