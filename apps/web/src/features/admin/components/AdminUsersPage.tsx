'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/core/providers/I18nProvider'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
import { useAdminUsers } from '../hooks/useAdminUsers'
import type { AdminUser } from '../services/adminUsers.service'
import type { NewAdminUserData } from './AddUserModal'
import {
  AdminUserCard,
  AdminUserListRow,
  AdminUsersEmptyState,
  AdminUsersFilterBar,
  AdminUsersHero,
  AdminUsersStatsGrid,
  type AdminRoleFilter,
  type AdminUsersViewMode,
} from './admin-users'
import { getAdminUserDisplayConfig } from './admin-users/service'

const EditUserModal = dynamic(
  () => import('./EditUserModal').then((mod) => ({ default: mod.EditUserModal })),
  { ssr: false },
)
const DeleteUserModal = dynamic(
  () => import('./DeleteUserModal').then((mod) => ({ default: mod.DeleteUserModal })),
  { ssr: false },
)
const AddUserModal = dynamic(
  () => import('./AddUserModal').then((mod) => ({ default: mod.AddUserModal })),
  { ssr: false },
)

const parseErrorResponse = async (response: Response): Promise<Record<string, unknown>> => {
  const data: unknown = await response.json().catch(() => ({}))
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
}

const getStringValue = (source: Record<string, unknown>, key: string) => {
  const value = source[key]
  return typeof value === 'string' ? value : undefined
}

const formatValidationErrors = (errors: unknown) => {
  if (!Array.isArray(errors)) {
    return null
  }

  const messages = errors
    .map((error) => {
      if (!error || typeof error !== 'object') {
        return null
      }

      const validationError = error as Record<string, unknown>
      const field = getStringValue(validationError, 'field')
      const message = getStringValue(validationError, 'message')

      if (!message) {
        return null
      }

      return field ? `${field}: ${message}` : message
    })
    .filter((message): message is string => Boolean(message))

  return messages.length > 0 ? messages.join(', ') : null
}

const hasInvalidDataMessage = (message: unknown) =>
  message === 'Datos inválidos' || message === 'Datos invÃ¡lidos'

export function AdminUsersPage() {
  const { users, stats, isLoading, error, refetch } = useAdminUsers()
  const theme = useAdminPanelTheme()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { language } = useLanguage()

  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter>('all')
  const [viewMode, setViewMode] = useState<AdminUsersViewMode>('cards')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredUsers = useMemo(() => {
    const searchQuery = searchTerm.trim().toLowerCase()

    return users.filter((user) => {
      const { displayName, email, role } = getAdminUserDisplayConfig(user)
      const matchesSearch =
        !searchQuery ||
        displayName.toLowerCase().includes(searchQuery) ||
        email.toLowerCase().includes(searchQuery) ||
        user.username.toLowerCase().includes(searchQuery)

      const matchesRole = roleFilter === 'all' || role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [roleFilter, searchTerm, users])

  const hasFilters = searchTerm.trim().length > 0 || roleFilter !== 'all'

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refetch()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: AdminUser) => {
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingUser(null)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setRoleFilter('all')
  }

  const handleSaveUser = async (userData: Partial<AdminUser>) => {
    if (!editingUser) return

    const response = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await parseErrorResponse(response)
      if (hasInvalidDataMessage(errorData.message) && errorData.errors) {
        const validationMessage = formatValidationErrors(errorData.errors)
        if (validationMessage) {
          throw new Error(validationMessage)
        }
      }

      throw new Error(
        getStringValue(errorData, 'error') ||
          getStringValue(errorData, 'message') ||
          t('users.page.errors.updateFailed'),
      )
    }

    await refetch()
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return

    const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      const errorData = await parseErrorResponse(response)
      throw new Error(getStringValue(errorData, 'error') || t('users.page.errors.deleteFailed'))
    }

    await refetch()
    closeDeleteModal()
  }

  const handleSaveNewUser = async (userData: NewAdminUserData) => {
    const response = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await parseErrorResponse(response)
      if (hasInvalidDataMessage(errorData.message) && errorData.errors) {
        const validationMessage = formatValidationErrors(errorData.errors)
        if (validationMessage) {
          throw new Error(validationMessage)
        }
      }

      throw new Error(
        getStringValue(errorData, 'error') ||
          getStringValue(errorData, 'message') ||
          t('users.page.errors.createFailed'),
      )
    }

    await refetch()
    setIsAddModalOpen(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.panelBg }}>
        <div className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center">
          <div
            className="flex w-full max-w-sm flex-col items-center rounded-[28px] border p-8 text-center shadow-sm"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.borderColor,
            }}
          >
            <div
              className="mb-5 h-12 w-12 animate-spin rounded-full border-4 border-transparent"
              style={{
                borderTopColor: theme.primaryColor,
                borderRightColor: `${theme.primaryColor}40`,
              }}
            />
            <p className="text-sm font-bold" style={{ color: theme.textColor }}>
              {t('users.page.loading')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.panelBg }}>
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[24px] border p-6 shadow-sm"
            style={{
              backgroundColor: theme.cardBg,
              borderColor: `${theme.dangerColor}30`,
            }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                style={{
                  backgroundColor: `${theme.dangerColor}12`,
                  borderColor: `${theme.dangerColor}24`,
                  color: theme.dangerColor,
                }}
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-extrabold" style={{ color: theme.textColor }}>
                  {t('users.page.errorLoading')}
                </h3>
                <p className="mt-2 text-sm font-medium" style={{ color: theme.subtextColor }}>
                  {error}
                </p>
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl px-5 text-sm font-bold"
                  style={{
                    backgroundColor: theme.primaryColor,
                    color: theme.onPrimaryColor,
                  }}
                >
                  <RefreshCw className={`h-4 w-4${isRefreshing ? ' animate-spin' : ''}`} />
                  {t('users.page.retry')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: theme.panelBg }}>
      <div className="mx-auto max-w-7xl space-y-6">
        <AdminUsersHero
          filteredCount={filteredUsers.length}
          isRefreshing={isRefreshing}
          onAddClick={() => setIsAddModalOpen(true)}
          onRefresh={handleRefresh}
          t={t}
        />

        <AdminUsersStatsGrid stats={stats} t={t} />

        <AdminUsersFilterBar
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          viewMode={viewMode}
          onSearchChange={setSearchTerm}
          onRoleFilterChange={setRoleFilter}
          onViewModeChange={setViewMode}
          t={t}
        />

        {filteredUsers.length === 0 ? (
          <AdminUsersEmptyState
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            onAddClick={() => setIsAddModalOpen(true)}
            t={t}
          />
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user, index) => (
              <AdminUserCard
                key={user.id}
                user={user}
                index={index}
                locale={language}
                onEdit={() => handleEditUser(user)}
                onDelete={() => handleDeleteUser(user)}
                t={t}
                tc={tc}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((user, index) => (
              <AdminUserListRow
                key={user.id}
                user={user}
                index={index}
                locale={language}
                onEdit={() => handleEditUser(user)}
                onDelete={() => handleDeleteUser(user)}
                t={t}
                tc={tc}
              />
            ))}
          </div>
        )}
      </div>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveUser}
      />

      <DeleteUserModal
        user={deletingUser}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSave={handleSaveNewUser}
      />
    </div>
  )
}
