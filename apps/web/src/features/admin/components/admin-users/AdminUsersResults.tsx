'use client'

import type { TFunction } from 'i18next'
import { AdminUserCard } from './AdminUserCard'
import { AdminUserListRow } from './AdminUserListRow'
import { AdminUsersEmptyState } from './AdminUsersEmptyState'
import type { AdminUser } from '../../services/adminUsers.service'
import type { AdminUsersViewMode } from './types'

interface AdminUsersResultsProps {
  users: AdminUser[]
  hasFilters: boolean
  viewMode: AdminUsersViewMode
  locale: string
  onAddClick: () => void
  onClearFilters: () => void
  onEditUser: (user: AdminUser) => void
  onDeleteUser: (user: AdminUser) => void
  onViewStats: (user: AdminUser) => void
  /** Prefetch del Panel Maestro al pasar el mouse: abrirlo se siente instantáneo. */
  onUserHover?: (user: AdminUser) => void
  t: TFunction<'admin'>
  tc: TFunction<'common'>
}

export function AdminUsersResults(props: AdminUsersResultsProps) {
  const { users, hasFilters, viewMode, locale, onAddClick, onClearFilters, onEditUser, onDeleteUser, onViewStats, onUserHover, t, tc } = props
  if (users.length === 0) {
    return <AdminUsersEmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} onAddClick={onAddClick} t={t} />
  }

  if (viewMode === 'cards') {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {users.map((user, index) => (
          <div key={user.id} onMouseEnter={onUserHover ? () => onUserHover(user) : undefined}>
            <AdminUserCard user={user} index={index} locale={locale} onEdit={() => onEditUser(user)} onDelete={() => onDeleteUser(user)} onViewStats={() => onViewStats(user)} t={t} tc={tc} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {users.map((user, index) => (
        <div key={user.id} onMouseEnter={onUserHover ? () => onUserHover(user) : undefined}>
          <AdminUserListRow user={user} index={index} locale={locale} onEdit={() => onEditUser(user)} onDelete={() => onDeleteUser(user)} onViewStats={() => onViewStats(user)} t={t} tc={tc} />
        </div>
      ))}
    </div>
  )
}
