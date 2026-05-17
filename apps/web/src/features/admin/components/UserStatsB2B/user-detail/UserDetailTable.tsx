'use client'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../../hooks/useAdminPanelTheme'
import { UserStatsEmptyState } from '../shared/UserStatsEmptyState'
import { UserStatsLoadingState } from '../shared/UserStatsLoadingState'
import type { UserDetail } from '../types'
import { UserDetailRow } from './UserDetailRow'

interface UserDetailTableProps {
  users: UserDetail[]
  isLoading: boolean
  onSelectUser: (user: UserDetail) => void
}

export function UserDetailTable({ users, isLoading, onSelectUser }: UserDetailTableProps) {
  const { t } = useTranslation(['admin', 'common'])
  const theme = useAdminPanelTheme()

  if (isLoading) return <UserStatsLoadingState />
  if (!users.length) return <UserStatsEmptyState message={t('userStats.emptyUsers', { ns: 'admin' })} />

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px]">
        <thead style={{ backgroundColor: theme.inputBg }}>
          <tr>
            {['user', 'organization', 'role', 'gender', 'age', 'courses', 'progress', 'hours', 'certificates', 'lastLogin'].map((key) => (
              <th key={key} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>
                {key === 'gender' ? t('demographics.gender.label', { ns: 'common' }) : t(`userStats.table.${key}`, { ns: 'admin' })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{users.map((user) => <UserDetailRow key={user.id} user={user} onSelect={onSelectUser} />)}</tbody>
      </table>
    </div>
  )
}
