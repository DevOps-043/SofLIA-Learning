'use client'

import { motion } from 'framer-motion'
import { Clock, MoreHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  getBusinessAnalyticsProgressColor,
  getBusinessAnalyticsStudyHours,
  getBusinessAnalyticsUserDisplayName,
  getBusinessAnalyticsUserInitials,
  getBusinessAnalyticsUserRoleTone,
} from '../../services/business-analytics-display.service'
import { BusinessAnalyticsUserAvatar } from './shared'
import type { BusinessAnalyticsUsersTableProps } from './types'

const ROLE_TONE_CLASSES = {
  admin: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  instructor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  member: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
} as const

export function BusinessAnalyticsUsersTable({
  users,
  onSelectUser,
}: BusinessAnalyticsUsersTableProps) {
  const { t } = useTranslation('business')
  const noNameLabel = t('analytics.usersTable.noName')

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border overflow-hidden backdrop-blur-sm bg-white dark:bg-[#0F1419] border-gray-200 dark:border-slate-700/30"
    >
      <div className="p-6 border-b border-gray-200 dark:border-slate-700/30">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('analytics.usersTable.title')}
        </h3>
        <p className="text-sm opacity-60">{t('analytics.usersTable.subtitle')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-sm uppercase tracking-wider text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.user')}</th>
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.role')}</th>
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.progress')}</th>
              <th className="p-4 font-medium text-center">{t('analytics.usersTable.columns.courses')}</th>
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.time')}</th>
              <th className="p-4 font-medium">{t('analytics.usersTable.columns.lastActivity')}</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/5">
            {users.length > 0 ? (
              users.map((user) => {
                const displayName = getBusinessAnalyticsUserDisplayName(user, noNameLabel)
                const initials = getBusinessAnalyticsUserInitials(user, noNameLabel)
                const roleTone = getBusinessAnalyticsUserRoleTone(user.role)

                return (
                  <tr
                    key={user.user_id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
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
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            {displayName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 min-w-[150px]">
                      <span
                        className={`
                          inline-block px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-normal break-words max-w-full
                          ${ROLE_TONE_CLASSES[roleTone]}
                        `}
                      >
                        {user.role || t('analytics.usersTable.student')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${user.average_progress}%`,
                              backgroundColor: getBusinessAnalyticsProgressColor(
                                user.average_progress,
                              ),
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-700 dark:text-gray-300">
                          {user.average_progress}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1 text-sm bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {user.courses_completed}
                        </span>
                        <span className="text-gray-400 opacity-60">/</span>
                        <span className="text-gray-700 dark:text-gray-300 font-medium">
                          {user.courses_assigned}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1 text-sm bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                        <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-300">
                          {getBusinessAnalyticsStudyHours(user.total_time_minutes)}h
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      <div className="inline-flex items-center text-sm bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/5 text-gray-700 dark:text-gray-300 font-medium">
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
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center opacity-50">
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
