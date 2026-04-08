'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../core/stores/themeStore';
import {
  useUnifiedInviteModalCore,
  type InviteTranslate,
  type UnifiedInviteTheme,
} from '../../../shared/components/unified-invite-modal';
import { useOrganizationStylesContext } from '../contexts/OrganizationStylesContext';

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
  const { styles } = useOrganizationStylesContext();
  const { resolvedTheme } = useThemeStore();
  const panelStyles = styles?.panel;

  const isDark = resolvedTheme === 'dark';
  const primaryColor = isDark ? '#00D4B3' : (panelStyles?.primary_button_color || '#0066FF');
  const accentColor = isDark ? '#00D4B3' : (panelStyles?.accent_color || '#00D4B3');

  const theme: UnifiedInviteTheme = {
    accentColor,
    borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    headerGradient: 'transparent',
    inputBg: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.05)',
    isDark,
    menuBg: isDark ? '#0b0e14' : '#FFFFFF',
    mutedText: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.5)',
    primaryColor,
    surfaceColor: isDark ? '#0b0e14' : '#FFFFFF',
    textColor: isDark ? '#FFFFFF' : '#0F172A',
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
