'use client'

import Image from 'next/image'
import { Briefcase, Calendar, LogIn } from 'lucide-react'
import { getBusinessUserStatsRoleTranslationKey } from '../../services/business-user-stats-display.service'
import type { BusinessUserStatsSidebarProps } from './types'

export function BusinessUserStatsSidebar({
  user,
  displayName,
  initials,
  t,
  theme,
  formatDate,
  formatRelativeTime,
}: BusinessUserStatsSidebarProps) {
  return (
    <div
      className="w-64 lg:w-72 p-4 lg:p-6 flex flex-col border-r shrink-0 overflow-y-auto"
      style={{
        background: theme.isDark
          ? `linear-gradient(135deg, color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent), color-mix(in srgb, ${theme.primaryColor} 6.3%, transparent))`
          : `linear-gradient(135deg, color-mix(in srgb, ${theme.primaryColor} 8.2%, transparent), color-mix(in srgb, ${theme.primaryColor} 2%, transparent))`,
        borderColor: theme.modalBorder,
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(128,128,128,0.2) transparent',
      }}
    >
      <div className="flex flex-col items-center mb-6">
        {user.profile_picture_url ? (
          <div
            className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 mb-4"
            style={{ borderColor: `color-mix(in srgb, ${theme.primaryColor} 25.1%, transparent)` }}
          >
            <Image
              src={user.profile_picture_url}
              alt={displayName}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        ) : (
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4"
            style={{
              background: `linear-gradient(135deg, ${theme.primaryColor}, color-mix(in srgb, ${theme.primaryColor} 86.7%, transparent))`,
              color: 'var(--color-bg-light)',
            }}
          >
            {initials}
          </div>
        )}
        <h2 className="text-lg font-bold text-center" style={{ color: theme.textColor }}>
          {displayName}
        </h2>
        <p
          className="text-sm text-center mt-1"
          style={{ color: theme.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          {user.email}
        </p>

        <div
          className="mt-3 px-3 py-1.5 rounded-full text-xs font-medium border"
          style={{
            backgroundColor: theme.isDark
              ? `color-mix(in srgb, ${theme.primaryColor} 18.8%, transparent)`
              : `color-mix(in srgb, ${theme.primaryColor} 12.5%, transparent)`,
            color: theme.isDark ? 'var(--color-bg-light)' : theme.primaryColor,
            borderColor: theme.isDark
              ? `color-mix(in srgb, ${theme.primaryColor} 31.4%, transparent)`
              : `color-mix(in srgb, ${theme.primaryColor} 18.8%, transparent)`,
          }}
        >
          {t(getBusinessUserStatsRoleTranslationKey(user.org_role))}
        </div>
      </div>

      <div className="space-y-3 lg:space-y-4 flex-1">
        <BusinessUserStatsInfoCard
          icon={Briefcase}
          label={t('users.stats.labels.typeRole')}
          value={user.job_title || user.platform_role || 'N/A'}
          theme={theme}
        />
        <BusinessUserStatsInfoCard
          icon={Calendar}
          label={t('users.stats.labels.lastConnection')}
          value={
            user.last_login_at
              ? formatRelativeTime(user.last_login_at)
              : t('users.stats.time.never')
          }
          secondaryValue={user.last_login_at ? formatDate(user.last_login_at) : undefined}
          theme={theme}
        />
        {user.joined_at && (
          <BusinessUserStatsInfoCard
            icon={LogIn}
            label={t('users.stats.labels.joined')}
            value={formatDate(user.joined_at)}
            theme={theme}
          />
        )}
      </div>
    </div>
  )
}

function BusinessUserStatsInfoCard({
  icon: Icon,
  label,
  value,
  secondaryValue,
  theme,
}: {
  icon: typeof Briefcase
  label: string
  value: string
  secondaryValue?: string
  theme: BusinessUserStatsSidebarProps['theme']
}) {
  return (
    <div
      className="p-3 rounded-xl border"
      style={{
        backgroundColor: theme.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
        borderColor: theme.modalBorder,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon
          className="w-4 h-4"
          style={{ color: theme.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }}
        />
        <span
          className="text-xs"
          style={{ color: theme.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          {label}
        </span>
      </div>
      <p className="text-sm font-medium" style={{ color: theme.textColor }}>
        {value}
      </p>
      {secondaryValue ? (
        <p
          className="text-xs mt-0.5"
          style={{ color: theme.isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.5)' }}
        >
          {secondaryValue}
        </p>
      ) : null}
    </div>
  )
}
