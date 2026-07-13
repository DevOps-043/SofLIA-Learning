'use client'

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminUser } from '../../../services/adminUsers.service'
import type { AdminPanelThemeTokens } from '../../../hooks/useAdminPanelTheme'
import { AdminUserAvatar } from '../AdminUserAvatar'
import { getMasterPanelDisplayName } from './profile-form.service'

interface MasterPanelHeaderProps {
  user: AdminUser
  theme: AdminPanelThemeTokens
  onClose: () => void
}

export function MasterPanelHeader({ user, theme, onClose }: MasterPanelHeaderProps) {
  const { t } = useTranslation('admin')
  const displayName = getMasterPanelDisplayName(user)

  return (
    <div
      className="flex flex-shrink-0 items-center justify-between gap-3 border-b px-6 py-4"
      style={{ borderColor: theme.borderColor }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <AdminUserAvatar
          displayName={displayName}
          imageUrl={user.profile_picture_url}
          size="sm"
          accentColor={theme.accentColor}
          borderColor={theme.borderColor}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.subtextColor }}>
            {t('users.masterPanel.eyebrow')}
          </p>
          <h2 className="truncate text-lg font-bold" style={{ color: theme.textColor }}>
            {displayName}
          </h2>
          <p className="truncate text-xs" style={{ color: theme.subtextColor }}>
            {user.email ?? t('users.page.noEmail')}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label={t('users.masterPanel.close')}
        className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border transition-all"
        style={{
          backgroundColor: theme.inputBg,
          borderColor: theme.borderColor,
          color: theme.textColor,
        }}
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
