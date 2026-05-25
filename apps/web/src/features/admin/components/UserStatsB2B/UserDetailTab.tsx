'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUserDetail } from '../../hooks/useUserStatsB2B'
import { UserProgressModal } from './UserProgressModal'
import { UserStatsErrorState } from './shared/UserStatsErrorState'
import { UserStatsSurfaceCard } from './shared/UserStatsSurfaceCard'
import type { UserDetail } from './types'
import { UserDetailFilters } from './user-detail/UserDetailFilters'
import { UserDetailPagination } from './user-detail/UserDetailPagination'
import { UserDetailTable } from './user-detail/UserDetailTable'
import { useUserDetailFilters } from './user-detail/useUserDetailFilters'

export function UserDetailTab() {
  const { t } = useTranslation('admin')
  const { search, debouncedSearch, statusFilter, page, limit, setPage, updateSearch, updateStatus } = useUserDetailFilters()
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null)
  const { data, isLoading, error } = useUserDetail({ search: debouncedSearch, org: '', status: statusFilter, page, limit })
  const totalPages = data ? Math.ceil(data.total / limit) : 0

  return (
    <div className="space-y-4">
      <UserDetailFilters search={search} statusFilter={statusFilter} onSearchChange={updateSearch} onStatusChange={updateStatus} />
      <UserStatsSurfaceCard className="overflow-hidden p-0">
        {error ? <UserStatsErrorState message={t('userStats.errors.users')} /> : null}
        {!error ? <UserDetailTable users={data?.users ?? []} isLoading={isLoading} onSelectUser={setSelectedUser} /> : null}
        {data && totalPages > 1 ? <UserDetailPagination page={page} totalPages={totalPages} total={data.total} limit={limit} onPageChange={setPage} /> : null}
      </UserStatsSurfaceCard>
      {selectedUser ? <UserProgressModal user={selectedUser} isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} /> : null}
    </div>
  )
}
