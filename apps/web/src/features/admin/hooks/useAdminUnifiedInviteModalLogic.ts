'use client';

import { useTranslation } from 'react-i18next';
import { useThemeStore } from '../../../core/stores/themeStore';
import {
  useUnifiedInviteModalCore,
  type InviteTranslate,
  type UnifiedInviteTheme,
} from '../../../shared/components/unified-invite-modal';
import { SOFLIA_ADMIN_COLORS } from '../constants/admin-color-tokens';

interface UseAdminUnifiedInviteModalProps {
  accentColor?: string;
  isOpen: boolean;
  onClose: () => void;
  onInviteSent?: () => void;
  onLinkCreated?: () => void;
  organizationId: string;
  primaryColor?: string;
}

export function useAdminUnifiedInviteModalLogic({
  accentColor = SOFLIA_ADMIN_COLORS.accent,
  isOpen,
  onClose,
  onInviteSent,
  onLinkCreated,
  organizationId,
  primaryColor = SOFLIA_ADMIN_COLORS.primary,
}: UseAdminUnifiedInviteModalProps) {
  const { t } = useTranslation('business');
  const { resolvedTheme } = useThemeStore();

  const isDark = resolvedTheme === 'dark';

  const theme: UnifiedInviteTheme = {
    accentColor,
    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    headerGradient: isDark
      ? `linear-gradient(135deg, color-mix(in srgb, ${primaryColor} 25.1%, transparent), color-mix(in srgb, ${accentColor} 12.5%, transparent))`
      : `linear-gradient(135deg, color-mix(in srgb, ${primaryColor} 6.3%, transparent), color-mix(in srgb, ${accentColor} 2%, transparent))`,
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    isDark,
    menuBg: isDark ? SOFLIA_ADMIN_COLORS.surfaceDark : SOFLIA_ADMIN_COLORS.white,
    mutedText: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)',
    onPrimaryColor: SOFLIA_ADMIN_COLORS.white,
    primaryColor,
    surfaceColor: isDark ? SOFLIA_ADMIN_COLORS.surfaceDark : SOFLIA_ADMIN_COLORS.white,
    textColor: isDark ? SOFLIA_ADMIN_COLORS.white : 'var(--color-legacy-0f172a)',
  };

  const controller = useUnifiedInviteModalCore({
    inputBg: theme.inputBg,
    inviteLinksBasePath: `/api/admin/companies/${organizationId}/invite-links`,
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
