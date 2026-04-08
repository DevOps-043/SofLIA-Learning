'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, MoreHorizontal, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BusinessPanelSearchInput } from '../shared/BusinessPanelSearchInput'
import { useBusinessPanelTheme } from '../../hooks/useBusinessPanelTheme'
import {
  getBusinessAnalyticsProgressColor,
  getBusinessAnalyticsStudyHours,
  getBusinessAnalyticsUserDisplayName,
  getBusinessAnalyticsUserInitials,
  getBusinessAnalyticsUserRoleTone,
} from '../../services/business-analytics-display.service'
import { BusinessAnalyticsUserAvatar } from './shared'
import type { BusinessAnalyticsUsersTableProps } from './types'

export function BusinessAnalyticsUsersTable({
  users,
  onSelectUser,
}: BusinessAnalyticsUsersTableProps) {
  const { t } = useTranslation('business')
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const noNameLabel = t('analytics.usersTable.noName')
  const panelTheme = useBusinessPanelTheme()

  const filteredUsers = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase()

    if (!query) return users

    return users.filter((user) => {
      const displayName = getBusinessAnalyticsUserDisplayName(user, noNameLabel)

      return [displayName, user.email, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [deferredSearchTerm, noNameLabel, users])

  const getRoleToneStyle = (roleTone: ReturnType<typeof getBusinessAnalyticsUserRoleTone>) => {
    if (roleTone === 'admin') {
      return {
        backgroundColor: `${panelTheme.brandColor}14`,
        color: panelTheme.brandColor,
        borderColor: `${panelTheme.brandColor}24`,
      }
    }

    if (roleTone === 'instructor') {
      return {
        backgroundColor: `${panelTheme.warningColor}14`,
        color: panelTheme.warningColor,
        borderColor: `${panelTheme.warningColor}24`,
      }
    }

    return {
      backgroundColor: `${panelTheme.actionColor}14`,
      color: panelTheme.actionColor,
      borderColor: `${panelTheme.actionColor}24`,
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border overflow-hidden backdrop-blur-sm"
      style={{
        backgroundColor: panelTheme.cardBg,
        borderColor: panelTheme.borderColor,
      }}
    >
      <div className="p-6 border-b" style={{ borderColor: panelTheme.dividerColor }}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold" style={{ color: panelTheme.textColor }}>
              {t('analytics.usersTable.title')}
            </h3>
            <p className="text-sm" style={{ color: panelTheme.subtextColor }}>
              {t('analytics.usersTable.subtitle')}
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{
              backgroundColor: panelTheme.hoverBg,
              border: `1px solid ${panelTheme.borderColor}`,
              color: panelTheme.mutedTextColor,
            }}
          >
            <Search className="w-3.5 h-3.5" />
            {filteredUsers.length} {t('analytics.usersTable.columns.user')}
          </div>
        </div>
      </div>

      <div className="p-6 pt-5">
        <BusinessPanelSearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder={t('users.placeholders.search')}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-left border-collapse">
          <thead>
            <tr
              className="text-sm uppercase tracking-wider border-y"
              style={{
                color: panelTheme.mutedTextColor,
                backgroundColor: panelTheme.hoverBg,
                borderColor: panelTheme.dividerColor,
              }}
            >
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.user')}</th>
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.role')}</th>
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.progress')}</th>
              <th className="p-4 font-medium text-center">{t('analytics.usersTable.columns.courses')}</th>
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.time')}</th>
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.lastActivity')}</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const displayName = getBusinessAnalyticsUserDisplayName(user, noNameLabel)
                const initials = getBusinessAnalyticsUserInitials(user, noNameLabel)
                const roleToneStyle = getRoleToneStyle(getBusinessAnalyticsUserRoleTone(user.role))

                return (
                  <tr
                    key={user.user_id}
                    style={{ borderBottom: `1px solid ${panelTheme.borderColor}` }}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <BusinessAnalyticsUserAvatar
                          imageUrl={user.profile_picture_url}
                          alt={displayName}
                          initials={initials}
                          size="sm"
                        />
                        <div>
                          <p className="font-semibold text-sm" style={{ color: panelTheme.textColor }}>
                            {displayName}
                          </p>
                          <p className="text-xs" style={{ color: panelTheme.subtextColor }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 min-w-[150px]">
                      <span
                        className="inline-block px-3 py-1.5 rounded-xl text-xs font-medium border whitespace-normal break-words max-w-full"
                        style={roleToneStyle}
                      >
                        {user.role || t('analytics.usersTable.student')}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex-1 h-2 rounded-full overflow-hidden max-w-[110px]"
                          style={{ backgroundColor: panelTheme.hoverBg }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${user.average_progress}%`,
                              backgroundColor: getBusinessAnalyticsProgressColor(user.average_progress),
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono" style={{ color: panelTheme.subtextColor }}>
                          {user.average_progress}%
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div
                        className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-xl border"
                        style={{
                          backgroundColor: panelTheme.inputBg,
                          borderColor: panelTheme.borderColor,
                        }}
                      >
                        <span style={{ color: panelTheme.successColor }} className="font-bold">
                          {user.courses_completed}
                        </span>
                        <span style={{ color: panelTheme.mutedTextColor }}>/</span>
                        <span style={{ color: panelTheme.textColor }} className="font-medium">
                          {user.courses_assigned}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      <div
                        className="inline-flex items-center gap-1 text-sm px-2.5 py-1 rounded-xl border"
                        style={{
                          backgroundColor: panelTheme.inputBg,
                          borderColor: panelTheme.borderColor,
                          color: panelTheme.subtextColor,
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        <span className="text-sm font-mono font-medium">
                          {getBusinessAnalyticsStudyHours(user.total_time_minutes)}h
                        </span>
                      </div>
                    </td>

                    <td className="p-4 text-sm">
                      <div
                        className="inline-flex items-center text-sm px-2.5 py-1 rounded-xl border font-medium"
                        style={{
                          backgroundColor: panelTheme.inputBg,
                          borderColor: panelTheme.borderColor,
                          color: panelTheme.subtextColor,
                        }}
                      >
                        {user.last_active
                          ? new Date(user.last_active).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })
                          : t('analytics.usersTable.never')}
                      </div>
                    </td>

                    <td className="p-4">
                      <button
                        onClick={() => onSelectUser(user)}
                        className="p-2 rounded-xl transition-colors"
                        style={{
                          backgroundColor: panelTheme.inputBg,
                          border: `1px solid ${panelTheme.borderColor}`,
                          color: panelTheme.subtextColor,
                        }}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td
                  colSpan={7}
                  className="p-10 text-center"
                  style={{ color: panelTheme.subtextColor }}
                >
                  {t('analytics.usersTable.noUsers')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}
