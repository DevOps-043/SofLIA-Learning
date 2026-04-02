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
  const primaryColor = panelStyles?.primary_button_color || '#0A2540';
  const accentColor = panelStyles?.accent_color || '#00D4B3';

  const theme: UnifiedInviteTheme = {
    accentColor,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    headerGradient: `linear-gradient(135deg, ${primaryColor}20, ${accentColor}10)`,
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    isDark,
    menuBg: isDark ? '#252b3b' : '#FFFFFF',
    mutedText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
    primaryColor,
    surfaceColor: isDark ? '#1a1f2e' : '#FFFFFF',
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
