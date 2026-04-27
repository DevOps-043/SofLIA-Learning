'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AcademicCapIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserCircleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminTheme } from '../hooks'
import { useAdminUsers } from '../hooks/useAdminUsers'
import type { NewAdminUserData } from './AddUserModal'
import type { AdminUser } from '../services/adminUsers.service'
import {
  AdminButton,
  AdminInput,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
  AdminSelect,
  AdminStatusBadge,
  AdminSurface,
  AdminTableContainer,
  AdminToolbar,
} from './ui'

const EditUserModal = dynamic(() => import('./EditUserModal').then((mod) => ({ default: mod.EditUserModal })), {
  ssr: false,
})
const DeleteUserModal = dynamic(() => import('./DeleteUserModal').then((mod) => ({ default: mod.DeleteUserModal })), {
  ssr: false,
})
const AddUserModal = dynamic(() => import('./AddUserModal').then((mod) => ({ default: mod.AddUserModal })), {
  ssr: false,
})

type ApiErrorPayload = {
  error?: string
  message?: string
  errors?: Array<{ field?: string; message?: string }>
}

const roleOptions = ['all', 'Usuario', 'Instructor', 'Administrador', 'Business']

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

function getDisplayName(user: AdminUser) {
  return user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
}

function getRoleMeta(role: string | null) {
  switch (role) {
    case 'Administrador':
      return { icon: ShieldCheckIcon, tone: 'primary' as const }
    case 'Instructor':
      return { icon: AcademicCapIcon, tone: 'info' as const }
    case 'Business':
      return { icon: UsersIcon, tone: 'primary' as const }
    default:
      return { icon: UserCircleIcon, tone: 'neutral' as const }
  }
}

function formatUserDate(value: string | null | undefined, fallback: string) {
  if (!value) return fallback

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return Boolean(value && typeof value === 'object')
}

function getApiErrorMessage(payload: unknown, fallback: string) {
  if (!isApiErrorPayload(payload)) return fallback

  if (Array.isArray(payload.errors) && payload.errors.length > 0) {
    return payload.errors
      .map((error) => [error.field, error.message].filter(Boolean).join(': '))
      .filter(Boolean)
      .join(', ')
  }

  return payload.error || payload.message || fallback
}

export function AdminUsersPage() {
  const { users, stats, isLoading, error, refetch } = useAdminUsers()
  const theme = useAdminTheme()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const normalizedSearch = searchTerm.trim().toLowerCase()
  const filteredUsers = users.filter((user) => {
    const displayName = getDisplayName(user).toLowerCase()
    const email = (user.email || '').toLowerCase()
    const username = (user.username || '').toLowerCase()
    const matchesSearch =
      !normalizedSearch ||
      displayName.includes(normalizedSearch) ||
      email.includes(normalizedSearch) ||
      username.includes(normalizedSearch)

    const matchesRole = filterRole === 'all' || user.cargo_rol === filterRole

    return matchesSearch && matchesRole
  })

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: AdminUser) => {
    setDeleteError(null)
    setDeletingUser(user)
    setIsDeleteModalOpen(true)
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
      const errorData: unknown = await response.json().catch(() => ({}))
      throw new Error(getApiErrorMessage(errorData, t('users.page.updateError')))
    }

    refetch()
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser) return

    try {
      const response = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => ({}))
        throw new Error(getApiErrorMessage(errorData, t('users.page.deleteError')))
      }

      await refetch()
      setIsDeleteModalOpen(false)
      setDeletingUser(null)
      setDeleteError(null)
    } catch (deleteUserError) {
      setDeleteError(deleteUserError instanceof Error ? deleteUserError.message : t('users.page.deleteError'))
    }
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
      const errorData: unknown = await response.json().catch(() => ({}))
      throw new Error(getApiErrorMessage(errorData, t('users.page.createError')))
    }

    refetch()
    setIsAddModalOpen(false)
  }

  if (isLoading) {
    return (
      <AdminPageShell maxWidth="wide">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <ArrowPathIcon className="h-8 w-8 animate-spin" style={{ color: theme.action }} />
            <p className="text-sm font-medium" style={{ color: theme.textMuted }}>
              {t('users.page.loading')}
            </p>
          </div>
        </div>
      </AdminPageShell>
    )
  }

  if (error) {
    return (
      <AdminPageShell maxWidth="wide">
        <AdminSurface className="p-5">
          <div className="flex items-start gap-4">
            <div className="rounded-xl p-2.5" style={{ backgroundColor: theme.dangerSurface, color: theme.danger }}>
              <ExclamationTriangleIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold" style={{ color: theme.text }}>
                {t('users.page.loadErrorTitle')}
              </h2>
              <p className="mt-1 text-sm" style={{ color: theme.textMuted }}>
                {error}
              </p>
              <AdminButton className="mt-4" onClick={refetch} icon={ArrowPathIcon}>
                {tc('actions.retry')}
              </AdminButton>
            </div>
          </div>
        </AdminSurface>
      </AdminPageShell>
    )
  }

  return (
    <AdminPageShell maxWidth="wide">
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants}>
          <AdminSectionHeader
            size="page"
            title={t('users.page.title')}
            description={t('users.page.found', { count: filteredUsers.length })}
            actions={
              <AdminButton onClick={() => setIsAddModalOpen(true)} icon={PlusIcon} size="lg">
                {t('users.page.addUser')}
              </AdminButton>
            }
          />
        </motion.div>

        <motion.div variants={itemVariants} className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            icon={UsersIcon}
            label={t('users.page.stats.total')}
            tone="primary"
            value={(stats?.totalUsers || 0).toLocaleString()}
          />
          <AdminMetricCard
            icon={CheckCircleIcon}
            label={t('users.page.stats.verified')}
            tone="info"
            value={(stats?.verifiedUsers || 0).toLocaleString()}
          />
          <AdminMetricCard
            icon={AcademicCapIcon}
            label={t('users.page.stats.instructors')}
            tone="neutral"
            value={(stats?.instructors || 0).toLocaleString()}
          />
          <AdminMetricCard
            icon={ShieldCheckIcon}
            label={t('users.page.stats.administrators')}
            tone="primary"
            value={(stats?.administrators || 0).toLocaleString()}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AdminToolbar>
            <div className="relative flex-1">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
                style={{ color: theme.textMuted }}
              />
              <AdminInput
                className="pl-10"
                type="text"
                placeholder={t('searchPlaceholders.users')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="relative w-full lg:w-60">
              <FunnelIcon
                className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
                style={{ color: theme.textMuted }}
              />
              <AdminSelect
                className="w-full pl-10"
                value={filterRole}
                onChange={(event) => setFilterRole(event.target.value)}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role === 'all' ? t('users.page.allRoles') : role}
                  </option>
                ))}
              </AdminSelect>
            </div>
          </AdminToolbar>
        </motion.div>

        <motion.div variants={itemVariants}>
          {filteredUsers.length === 0 ? (
            <AdminSurface className="px-6 py-12 text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: theme.actionSurface, color: theme.action }}
              >
                <UsersIcon className="h-7 w-7" />
              </div>
              <h2 className="text-lg font-bold" style={{ color: theme.text }}>
                {t('users.page.emptyTitle')}
              </h2>
              <p className="mt-2 text-sm" style={{ color: theme.textMuted }}>
                {searchTerm || filterRole !== 'all' ? t('users.page.emptyFiltered') : t('users.page.emptyAll')}
              </p>
            </AdminSurface>
          ) : (
            <AdminTableContainer>
              <div className="max-h-[calc(100vh-320px)] min-h-[320px] overflow-auto">
                <table className="min-w-[980px] w-full text-left">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ backgroundColor: theme.surfaceSubtle }}>
                      {[
                        t('users.page.table.user'),
                        t('users.page.table.email'),
                        t('users.page.table.role'),
                        t('users.page.table.status'),
                        t('users.page.table.lastAccess'),
                        t('users.page.table.actions'),
                      ].map((heading, index) => (
                        <th
                          key={heading}
                          className={`border-b px-4 py-3 text-xs font-bold uppercase tracking-wider ${
                            index === 5 ? 'text-right' : 'text-left'
                          }`}
                          style={{ borderColor: theme.divider, color: theme.textMuted }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence initial={false}>
                      {filteredUsers.map((user, index) => {
                        const displayName = getDisplayName(user)
                        const roleMeta = getRoleMeta(user.cargo_rol)
                        const RoleIcon = roleMeta.icon

                        return (
                          <motion.tr
                            key={user.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ delay: Math.min(index * 0.015, 0.18) }}
                            className="transition-colors"
                            style={{ borderBottom: `1px solid ${theme.divider}` }}
                          >
                            <td className="px-4 py-4">
                              <div className="flex min-w-0 items-center gap-3">
                                {user.profile_picture_url ? (
                                  <img
                                    src={user.profile_picture_url}
                                    alt={displayName}
                                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                                    style={{ border: `1px solid ${theme.border}` }}
                                  />
                                ) : (
                                  <div
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                    style={{ backgroundColor: theme.primary, color: theme.inverseText }}
                                  >
                                    {displayName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold" style={{ color: theme.text }} title={displayName}>
                                    {displayName}
                                  </p>
                                  <p className="truncate text-xs" style={{ color: theme.textMuted }} title={`@${user.username}`}>
                                    @{user.username}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <p className="truncate text-sm" style={{ color: theme.text }} title={user.email || ''}>
                                {user.email || t('users.page.noEmail')}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <AdminStatusBadge tone={roleMeta.tone}>
                                <RoleIcon className="h-3.5 w-3.5" />
                                {user.cargo_rol || t('users.page.roleFallback')}
                              </AdminStatusBadge>
                            </td>
                            <td className="px-4 py-4">
                              <AdminStatusBadge tone={user.email_verified ? 'success' : 'warning'}>
                                {user.email_verified ? <CheckCircleIcon className="h-3.5 w-3.5" /> : <ClockIcon className="h-3.5 w-3.5" />}
                                {user.email_verified ? t('users.page.status.verified') : t('users.page.status.pending')}
                              </AdminStatusBadge>
                            </td>
                            <td className="px-4 py-4">
                              <p className="text-sm" style={{ color: theme.textMuted }}>
                                {formatUserDate(user.last_login_at || user.updated_at, t('users.page.never'))}
                              </p>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleEditUser(user)}
                                  className="rounded-lg p-2 transition hover:opacity-80"
                                  style={{ color: theme.action, backgroundColor: theme.actionSurface }}
                                  title={tc('actions.edit')}
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user)}
                                  className="rounded-lg p-2 transition hover:opacity-80"
                                  style={{ color: theme.danger, backgroundColor: theme.dangerSurface }}
                                  title={tc('actions.delete')}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </AdminTableContainer>
          )}
        </motion.div>
      </motion.div>

      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingUser(null)
        }}
        onSave={handleSaveUser}
      />

      <DeleteUserModal
        user={deletingUser}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingUser(null)
          setDeleteError(null)
        }}
        onConfirm={handleConfirmDelete}
      />

      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewUser} />

      {deleteError ? (
        <div
          className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border px-4 py-3 text-sm font-medium shadow-lg"
          style={{ backgroundColor: theme.surface, borderColor: theme.danger, color: theme.danger }}
        >
          {deleteError}
        </div>
      ) : null}
    </AdminPageShell>
  )
}
