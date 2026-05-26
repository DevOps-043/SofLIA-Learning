'use client'

import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/core/providers/I18nProvider'
import { useAdminUsers } from '../hooks/useAdminUsers'
import type { AdminUser } from '../services/adminUsers.service'
import type { NewAdminUserData } from './AddUserModal'
import {
  AdminUsersErrorState,
  AdminUsersFilterBar,
  AdminUsersHero,
  AdminUsersLoadingState,
  AdminUsersModals,
  AdminUsersResults,
  AdminUsersStatsGrid,
  useAdminUsersPageState,
} from './admin-users'
import { createAdminUser, deleteAdminUser, saveAdminUser } from './admin-users/admin-users-api'

export function AdminUsersPage() {
  const { users, stats, isLoading, error, refetch } = useAdminUsers()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { language } = useLanguage()
  const state = useAdminUsersPageState(users)

  const handleRefresh = async () => {
    state.setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      state.setIsRefreshing(false)
    }
  }

  const handleEditUser = (user: AdminUser) => {
    state.setEditingUser(user)
    state.setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: AdminUser) => {
    state.setDeletingUser(user)
    state.setIsDeleteModalOpen(true)
  }

  const handleSaveUser = async (userData: Partial<AdminUser>) => {
    if (!state.editingUser) return
    await saveAdminUser(state.editingUser, userData, t)
    await refetch()
  }

  const handleConfirmDelete = async () => {
    if (!state.deletingUser) return
    await deleteAdminUser(state.deletingUser, t)
    await refetch()
    state.setIsDeleteModalOpen(false)
    state.setDeletingUser(null)
  }

  const handleSaveNewUser = async (userData: NewAdminUserData) => {
    await createAdminUser(userData, t)
    await refetch()
    state.setIsAddModalOpen(false)
  }

  if (isLoading) return <AdminUsersLoadingState t={t} />
  if (error) return <AdminUsersErrorState error={error} isRefreshing={state.isRefreshing} onRetry={handleRefresh} t={t} />

  return (
    <div>
      <div className="mx-auto max-w-7xl space-y-6">
        <AdminUsersHero filteredCount={state.filteredUsers.length} isRefreshing={state.isRefreshing} onAddClick={() => state.setIsAddModalOpen(true)} onRefresh={handleRefresh} t={t} />
        <AdminUsersStatsGrid stats={stats} t={t} />
        <AdminUsersFilterBar searchTerm={state.searchTerm} roleFilter={state.roleFilter} viewMode={state.viewMode} onSearchChange={state.setSearchTerm} onRoleFilterChange={state.setRoleFilter} onViewModeChange={state.setViewMode} t={t} />
        <AdminUsersResults users={state.filteredUsers} hasFilters={state.hasFilters} viewMode={state.viewMode} locale={language} onAddClick={() => state.setIsAddModalOpen(true)} onClearFilters={() => { state.setSearchTerm(''); state.setRoleFilter('all') }} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} t={t} tc={tc} />
      </div>
      <AdminUsersModals editingUser={state.editingUser} deletingUser={state.deletingUser} isEditModalOpen={state.isEditModalOpen} isDeleteModalOpen={state.isDeleteModalOpen} isAddModalOpen={state.isAddModalOpen} onCloseEdit={() => { state.setIsEditModalOpen(false); state.setEditingUser(null) }} onCloseDelete={() => { state.setIsDeleteModalOpen(false); state.setDeletingUser(null) }} onCloseAdd={() => state.setIsAddModalOpen(false)} onSaveEdit={handleSaveUser} onConfirmDelete={handleConfirmDelete} onSaveNewUser={handleSaveNewUser} />
    </div>
  )
}
