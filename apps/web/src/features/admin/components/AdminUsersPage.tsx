'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/core/providers/I18nProvider'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useAdminUserStatsFilters } from '../hooks/useAdminUserStatsFilters'
import type { AdminUser } from '../services/adminUsers.service'
import type { NewAdminUserData } from './AddUserModal'
import {
  AdminUserStatsModal,
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
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { language } = useLanguage()

  const [organizationFilter, setOrganizationFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [learningPathFilter, setLearningPathFilter] = useState('')
  const hasDirectoryFilters = Boolean(organizationFilter || courseFilter || learningPathFilter)

  const { users, stats, isLoading, error, refetch } = useAdminUsers({
    organizationId: organizationFilter || undefined,
    courseId: courseFilter || undefined,
    learningPathId: learningPathFilter || undefined,
  })
  const { companies, courses, learningPaths } = useAdminUserStatsFilters()
  const state = useAdminUsersPageState(users)

  const companyLabel =
    companies.find((option) => option.value === organizationFilter)?.label ?? null

  const clearAllFilters = () => {
    state.setSearchTerm('')
    state.setRoleFilter('all')
    setOrganizationFilter('')
    setCourseFilter('')
    setLearningPathFilter('')
  }

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
        <AdminUsersFilterBar
          searchTerm={state.searchTerm}
          roleFilter={state.roleFilter}
          viewMode={state.viewMode}
          organizationFilter={organizationFilter}
          courseFilter={courseFilter}
          learningPathFilter={learningPathFilter}
          companyOptions={companies}
          courseOptions={courses}
          learningPathOptions={learningPaths}
          onSearchChange={state.setSearchTerm}
          onRoleFilterChange={state.setRoleFilter}
          onViewModeChange={state.setViewMode}
          onOrganizationFilterChange={setOrganizationFilter}
          onCourseFilterChange={setCourseFilter}
          onLearningPathFilterChange={setLearningPathFilter}
          t={t}
        />
        <AdminUsersResults users={state.filteredUsers} hasFilters={state.hasFilters || hasDirectoryFilters} viewMode={state.viewMode} locale={language} onAddClick={() => state.setIsAddModalOpen(true)} onClearFilters={clearAllFilters} onEditUser={handleEditUser} onDeleteUser={handleDeleteUser} onViewStats={state.setStatsUser} t={t} tc={tc} />
      </div>
      <AdminUsersModals editingUser={state.editingUser} deletingUser={state.deletingUser} isEditModalOpen={state.isEditModalOpen} isDeleteModalOpen={state.isDeleteModalOpen} isAddModalOpen={state.isAddModalOpen} onCloseEdit={() => { state.setIsEditModalOpen(false); state.setEditingUser(null) }} onCloseDelete={() => { state.setIsDeleteModalOpen(false); state.setDeletingUser(null) }} onCloseAdd={() => state.setIsAddModalOpen(false)} onSaveEdit={handleSaveUser} onConfirmDelete={handleConfirmDelete} onSaveNewUser={handleSaveNewUser} />
      {state.statsUser ? (
        <AdminUserStatsModal
          user={state.statsUser}
          isOpen={Boolean(state.statsUser)}
          organizationLabel={companyLabel}
          defaultOrganizationId={organizationFilter || null}
          onClose={() => state.setStatsUser(null)}
        />
      ) : null}
    </div>
  )
}
