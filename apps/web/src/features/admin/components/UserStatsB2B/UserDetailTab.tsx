'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, UserCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useUserDetail } from '../../hooks/useUserStatsB2B'
import { useAdminTheme } from '../../hooks/useAdminTheme'
import {
  AdminIconButton,
  AdminInput,
  AdminSelect,
  AdminStatusBadge,
  AdminSurface,
  AdminTableContainer,
} from '../ui'
import { UserProgressModal } from './UserProgressModal'
import type { UserDetail } from './types'

export function UserDetailTab() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [orgFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)

  const { data, isLoading } = useUserDetail({
    search: debouncedSearch,
    org: orgFilter,
    status: statusFilter,
    page,
    limit,
  })

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timeout)
  }, [search])

  const totalPages = data ? Math.ceil(data.total / limit) : 0

  const formatDate = (date: string | null) => {
    if (!date) {
      return t('userStatsPage.userDetail.never')
    }

    return new Date(date).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-4">
      <AdminSurface className="p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: theme.textMuted }} />
            <AdminInput
              type="text"
              placeholder={t('userStatsPage.userDetail.searchPlaceholder')}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              className="pl-10"
            />
          </div>
          <AdminSelect
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}
          >
            <option value="">{t('userStatsPage.userDetail.allStatuses')}</option>
            <option value="active">{t('userStatsPage.userDetail.activeStatus')}</option>
            <option value="inactive">{t('userStatsPage.userDetail.inactiveStatus')}</option>
          </AdminSelect>
        </div>
      </AdminSurface>

      <AdminTableContainer>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead style={{ backgroundColor: theme.surfaceSubtle, color: theme.textMuted }}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">{t('userStatsPage.userDetail.table.user')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">{t('userStatsPage.userDetail.table.organization')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">{t('userStatsPage.userDetail.table.role')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">{t('userStatsPage.userDetail.table.courses')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">{t('userStatsPage.userDetail.table.progress')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">{t('userStatsPage.userDetail.table.hours')}</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider">{t('userStatsPage.userDetail.table.certificates')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">{t('userStatsPage.userDetail.table.lastLogin')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="flex justify-center">
                      <div
                        className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
                        style={{ borderColor: theme.action, borderTopColor: 'transparent' }}
                      />
                    </div>
                  </td>
                </tr>
              ) : data?.users && data.users.length > 0 ? (
                data.users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedUser(user)}
                    className="cursor-pointer transition-opacity hover:opacity-85"
                    style={{ borderTop: `1px solid ${theme.divider}` }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.profilePictureUrl ? (
                          <img src={user.profilePictureUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ backgroundColor: theme.action, color: theme.onAction }}
                          >
                            <UserCheck className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: theme.text }}>
                            {user.displayName || user.username}
                          </p>
                          <p className="truncate text-xs" style={{ color: theme.textMuted }}>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: theme.textMuted }}>
                      {user.organization || t('userStatsPage.userDetail.emptyCell')}
                    </td>
                    <td className="px-4 py-3">
                      {user.orgRole ? (
                        <AdminStatusBadge tone="info">{user.orgRole}</AdminStatusBadge>
                      ) : (
                        <span className="text-sm" style={{ color: theme.textMuted }}>
                          {t('userStatsPage.userDetail.emptyCell')}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm" style={{ color: theme.text }}>{user.coursesEnrolled}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-16 rounded-full" style={{ backgroundColor: theme.surfaceSubtle }}>
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${Math.min(user.avgProgress, 100)}%`, backgroundColor: theme.action }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: theme.textMuted }}>{user.avgProgress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm" style={{ color: theme.text }}>{user.studyHours}h</td>
                    <td className="px-4 py-3 text-center text-sm" style={{ color: theme.text }}>{user.certificates}</td>
                    <td className="px-4 py-3 text-sm" style={{ color: theme.textMuted }}>{formatDate(user.lastLogin)}</td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm" style={{ color: theme.textMuted }}>
                    {t('userStatsPage.userDetail.noUsers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: theme.divider }}>
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {t('userStatsPage.userDetail.showing', {
                from: (page - 1) * limit + 1,
                to: Math.min(page * limit, data?.total || 0),
                total: data?.total || 0,
              })}
            </p>
            <div className="flex items-center gap-2">
              <AdminIconButton
                icon={ChevronLeft}
                label={t('userStatsPage.userDetail.previous')}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                tone="neutral"
              />
              <span className="text-sm" style={{ color: theme.textMuted }}>
                {t('userStatsPage.userDetail.pageOf', { page, totalPages })}
              </span>
              <AdminIconButton
                icon={ChevronRight}
                label={t('userStatsPage.userDetail.next')}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                tone="neutral"
              />
            </div>
          </div>
        ) : null}
      </AdminTableContainer>

      {selectedUser ? (
        <UserProgressModal
          user={selectedUser}
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
        />
      ) : null}
    </div>
  )
}
