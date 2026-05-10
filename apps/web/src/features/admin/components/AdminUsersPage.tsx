'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { 
  UsersIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/core/providers/I18nProvider'
import { useAdminUsers } from '../hooks/useAdminUsers'
import type { NewAdminUserData } from './AddUserModal'
import type { AdminUser } from '../services/adminUsers.service'
import { useThemeStore } from '@/core/stores/themeStore'
import { formatDistanceToNow } from 'date-fns'
import { es, enUS, pt } from 'date-fns/locale'

const EditUserModal = dynamic(() => import('./EditUserModal').then(mod => ({ default: mod.EditUserModal })), {
  ssr: false
})
const DeleteUserModal = dynamic(() => import('./DeleteUserModal').then(mod => ({ default: mod.DeleteUserModal })), {
  ssr: false
})
const AddUserModal = dynamic(() => import('./AddUserModal').then(mod => ({ default: mod.AddUserModal })), {
  ssr: false
})

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
}

const getAdminUserDisplayName = (user: AdminUser) =>
  user.display_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username

const getAdminUserEmail = (user: AdminUser) => user.email ?? ''

const getAdminUserRole = (user: AdminUser) => user.cargo_rol || 'Usuario'

const parseErrorResponse = async (response: Response): Promise<Record<string, unknown>> => {
  const data: unknown = await response.json().catch(() => ({}))
  return data && typeof data === 'object' ? data as Record<string, unknown> : {}
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

const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: 'primary' | 'success' | 'accent' | 'warning' }) => {
  const colors = {
    primary: 'text-[#0A2540] dark:text-white',
    success: 'text-[#10B981]',
    accent: 'text-[#F59E0B]',
    warning: 'text-[#00D4B3]'
  }
  return (
    <div className="bg-white dark:bg-[#1E2329] p-6 rounded-2xl border border-[#E9ECEF] dark:border-white/5 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[#6C757D] dark:text-white/60 text-sm font-medium">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-gray-50 dark:bg-[#0A0D12]`}>
        <Icon className="h-6 w-6 text-[#6C757D]" />
      </div>
    </div>
  )
}

export function AdminUsersPage() {
  const { users, stats, isLoading, error, refetch } = useAdminUsers()
  const { resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const primaryAccent = isDark ? '#00D4B3' : '#0A2540'

  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { language } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filteredUsers = users.filter(user => {
    const searchQuery = searchTerm.toLowerCase()
    const displayName = getAdminUserDisplayName(user)
    const email = getAdminUserEmail(user)
    const matchesSearch = displayName.toLowerCase().includes(searchQuery) ||
                         email.toLowerCase().includes(searchQuery) ||
                         user.username.toLowerCase().includes(searchQuery)
    
    const matchesRole = roleFilter === 'all' || getAdminUserRole(user) === roleFilter
    
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Administrador':
        return {
          bg: isDark ? 'bg-[#00D4B3]/10' : 'bg-[#0A2540]/10',
          text: isDark ? 'text-[#00D4B3]' : 'text-[#0A2540]',
          border: isDark ? 'border-[#00D4B3]/20' : 'border-[#0A2540]/20',
          icon: ShieldCheckIcon
        }
      case 'Instructor':
        return {
          bg: 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20',
          text: 'text-[#F59E0B]',
          border: 'border-[#F59E0B]/20',
          icon: AcademicCapIcon
        }
      case 'Usuario':
        return {
          bg: 'bg-[#10B981]/10 dark:bg-[#10B981]/20',
          text: 'text-[#10B981]',
          border: 'border-[#10B981]/20',
          icon: UserCircleIcon
        }
      default:
        return {
          bg: 'bg-[#6C757D]/10 dark:bg-[#6C757D]/20',
          text: 'text-[#6C757D]',
          border: 'border-[#6C757D]/20',
          icon: UserCircleIcon
        }
    }
  }

  const dateLocalesMap = {
    es,
    en: enUS,
    pt
  }
  const currentLocale = (dateLocalesMap[language as keyof typeof dateLocalesMap] || es) as any

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = (user: AdminUser) => {
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
      const errorData = await parseErrorResponse(response)
      if (errorData?.message === 'Datos inválidos' && errorData?.errors) {
        const validationMessage = formatValidationErrors(errorData.errors)
        if (validationMessage) {
          throw new Error(validationMessage)
        }
      }
      throw new Error(
        getStringValue(errorData, 'error') ||
        getStringValue(errorData, 'message') ||
        t('users.page.errors.updateFailed')
      )
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
        const errorData = await parseErrorResponse(response)
        throw new Error(getStringValue(errorData, 'error') || t('users.page.errors.deleteFailed'))
      }

      await refetch()
      setIsDeleteModalOpen(false)
      setDeletingUser(null)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : t('users.page.errors.deleteFailed'))
    }
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingUser(null)
  }

  const handleSaveNewUser = async (userData: NewAdminUserData) => {
    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const errorData = await parseErrorResponse(response)
        if (errorData?.message === 'Datos inválidos' && errorData?.errors) {
          const validationMessage = formatValidationErrors(errorData.errors)
          if (validationMessage) {
            throw new Error(validationMessage)
          }
        }
        throw new Error(
          getStringValue(errorData, 'error') ||
          getStringValue(errorData, 'message') ||
          t('users.page.errors.createFailed')
        )
      }

      refetch()
      setIsAddModalOpen(false)
    } catch (error) {
      throw error
    }
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
  }

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen bg-white dark:bg-[#0F1419]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#00D4B3]/20 border-t-[#00D4B3] rounded-full animate-spin" />
              <p className="text-[#6C757D] dark:text-white/60 animate-pulse font-medium">
                {t('users.page.loading')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 min-h-screen bg-white dark:bg-[#0F1419]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-[#1E2329] border border-red-500/20 dark:border-red-500/30 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <XMarkIcon className="h-5 w-5 text-red-500" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[#0A2540] dark:text-white mb-2">
                  {t('users.page.errorLoading')}
                </h3>
                <p className="text-sm text-[#6C757D] dark:text-white/70 mb-4">
                  {error}
                </p>
                <motion.button
                  onClick={refetch}
                  whileHover={{ scale: 1.02, backgroundColor: isDark ? '#00BD9F' : '#0d2f4d' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors duration-200"
                  style={{ backgroundColor: primaryAccent }}
                >
                  {t('users.page.retry')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F9FAFB] dark:bg-[#0F1419]">
      <div className="max-w-7xl mx-auto space-y-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-8"
        >
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#00D4B3]/10 dark:bg-[#00D4B3]/20 rounded-xl">
                <UsersIcon className="h-6 w-6 text-[#00D4B3]" />
              </div>
              <h1 className="text-3xl font-bold text-[#0A2540] dark:text-white tracking-tight">
                {t('users.page.title')}
              </h1>
            </div>
            <p className="text-[#6C757D] dark:text-white/60 font-medium flex items-center gap-2 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00D4B3]" />
              {t(filteredUsers.length === 1 ? 'users.page.subtitle_one' : 'users.page.subtitle', { count: filteredUsers.length })}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0A2540] hover:bg-[#0d2f4d] text-white rounded-2xl font-semibold transition-all shadow-xl shadow-[#0A2540]/20 border border-white/10"
          >
            <div className="p-1 bg-white/10 rounded-lg">
              <PlusIcon className="h-4 w-4" />
            </div>
            {t('users.page.addUser')}
          </motion.button>
        </div>

          {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={UsersIcon}
            label={t('users.page.stats.total')}
            value={stats?.totalUsers || 0}
            color="primary"
          />
          <StatCard
            icon={CheckBadgeIcon}
            label={t('users.page.stats.verified')}
            value={stats?.verifiedUsers || 0}
            color="success"
          />
          <StatCard
            icon={AcademicCapIcon}
            label={t('users.page.stats.instructors')}
            value={stats?.instructors || 0}
            color="accent"
          />
          <StatCard
            icon={ShieldCheckIcon}
            label={t('users.page.stats.admins')}
            value={stats?.administrators || 0}
            color="warning"
          />
        </div>

          {/* Search and Filter Bar */}
          <motion.div variants={itemVariants}>
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96 group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6C757D] group-focus-within:text-[#00D4B3] transition-colors" />
              <input
                type="text"
                placeholder={t('users.page.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#0A0D12] border border-[#E9ECEF] dark:border-[#6C757D]/20 rounded-2xl text-[#0A2540] dark:text-white placeholder-[#6C757D] focus:ring-2 focus:ring-[#00D4B3]/40 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="flex items-center w-full md:w-auto">
              <div className="flex items-center gap-1 p-1 bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/20 overflow-x-auto no-scrollbar max-w-full">
                {['all', 'Usuario', 'Instructor', 'Administrador', 'Business'].map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role as any)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                      roleFilter === role
                        ? 'bg-white dark:bg-[#1E2329] text-[#0A2540] dark:text-[#00D4B3] shadow-sm'
                        : 'text-[#6C757D] hover:text-[#0A2540] dark:hover:text-white'
                    }`}
                  >
                    {role === 'all' ? t('users.page.filterRoleAll') : t(`users.roles.${role}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          </motion.div>

          {/* Users Grid/List */}
          <motion.div variants={itemVariants}>
            {filteredUsers.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-20 h-20 bg-[#E9ECEF] dark:bg-[#0A0D12] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#E9ECEF] dark:border-[#6C757D]/20">
                <UsersIcon className="h-10 w-10 text-[#6C757D]" />
              </div>
              <h3 className="text-xl font-bold text-[#0A2540] dark:text-white mb-2">
                {t('users.page.empty.title')}
              </h3>
              <p className="text-[#6C757D] dark:text-white/60">
                {searchTerm || roleFilter !== 'all'
                  ? t('users.page.empty.searchFilter')
                  : t('users.page.empty.noUsers')}
              </p>
            </div>
            ) : (
              <div className="bg-white dark:bg-[#1E2329] rounded-xl border border-[#E9ECEF] dark:border-[#6C757D]/30 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-320px)] min-h-[300px]">
                  <table className="min-w-full divide-y divide-[#E9ECEF] dark:divide-[#6C757D]/30">
                  <thead className="bg-[#E9ECEF]/30 dark:bg-[#0A0D12]/50 border-b border-[#E9ECEF] dark:border-[#6C757D]/20">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#6C757D] uppercase tracking-wider">
                        {t('users.page.table.user')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#6C757D] uppercase tracking-wider">
                        {t('users.page.table.email')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#6C757D] uppercase tracking-wider">
                        {t('users.page.table.role')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#6C757D] uppercase tracking-wider">
                        {t('users.page.table.status')}
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#6C757D] uppercase tracking-wider">
                        {t('users.page.table.lastAccess')}
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-[#6C757D] uppercase tracking-wider">
                        {t('users.page.table.actions')}
                      </th>
                    </tr>
                  </thead>
                    <tbody className="bg-white dark:bg-[#1E2329] divide-y divide-[#E9ECEF] dark:divide-[#6C757D]/30">
                      <AnimatePresence>
                        {filteredUsers.map((user, index) => {
                          const displayName = getAdminUserDisplayName(user)
                          const email = getAdminUserEmail(user)
                          const role = getAdminUserRole(user)
                          const roleBadge = getRoleBadge(role)
                          const RoleIcon = roleBadge.icon
                          
                          return (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ delay: index * 0.02, duration: 0.3 }}
                              className="hover:bg-[#E9ECEF]/50 dark:hover:bg-[#0A0D12] transition-colors duration-200 group"
                            >
                              <td className="px-4 py-5 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  <div className="relative">
                                    {user.profile_picture_url ? (
                                      <motion.img
                                        src={user.profile_picture_url}
                                        alt={displayName}
                                        className="h-10 w-10 rounded-full object-cover border-2 border-[#E9ECEF] dark:border-[#6C757D]/30"
                                        whileHover={{ scale: 1.1 }}
                                      />
                                    ) : (
                                      <motion.div
                                        className="h-10 w-10 rounded-full bg-gradient-to-br from-[#0A2540] to-[#00D4B3] flex items-center justify-center text-white text-sm font-semibold border-2 border-[#E9ECEF] dark:border-[#6C757D]/30"
                                        whileHover={{ scale: 1.1 }}
                                      >
                                        {displayName.charAt(0).toUpperCase()}
                                      </motion.div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-[#0A2540] dark:text-white truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]" title={displayName}>
                                      {displayName}
                                    </div>
                                    <div className="text-xs text-[#6C757D] dark:text-white/60 truncate max-w-[120px] sm:max-w-[150px] lg:max-w-[200px]" title={`@${user.username}`}>
                                      @{user.username}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-5 whitespace-nowrap">
                                <div className="text-sm text-[#0A2540] dark:text-white truncate max-w-[150px] sm:max-w-[200px] lg:max-w-[250px]" title={email || undefined}>
                                  {email}
                                </div>
                              </td>
                              <td className="px-4 py-5 whitespace-nowrap">
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}
                                >
                                  <RoleIcon className="h-3.5 w-3.5" />
                                  {t(`users.roles.${role}`)}
                                </motion.span>
                              </td>
                              <td className="px-4 py-5 whitespace-nowrap">
                                <motion.span
                                  whileHover={{ scale: 1.05 }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg ${
                                    user.email_verified
                                      ? 'bg-[#10B981]/10 dark:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/20'
                                      : 'bg-[#F59E0B]/10 dark:bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/20'
                                  }`}
                                >
                                  {user.email_verified ? (
                                    <CheckCircleIcon className="h-3.5 w-3.5" />
                                  ) : (
                                    <ClockIcon className="h-3.5 w-3.5" />
                                  )}
                                  {user.email_verified ? t('users.page.status.verified') : t('users.page.status.pending')}
                                </motion.span>
                              </td>
                              <td className="px-4 py-5 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm text-[#0A2540] dark:text-white/90 font-medium mb-0.5">
                                  {user.updated_at
                                    ? new Date(user.updated_at).toLocaleDateString(language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-BR' : 'en-US', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })
                                    : t('users.page.lastAccessNever')}
                                </span>
                                {user.updated_at && (
                                  <span className="text-[10px] text-[#6C757D] dark:text-white/40 uppercase tracking-wider">
                                    {formatDistanceToNow(new Date(user.updated_at), { addSuffix: true, locale: currentLocale })}
                                  </span>
                                )}
                              </div>
                              </td>
                              <td className="px-4 py-5 whitespace-nowrap text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <motion.button
                                    onClick={() => handleEditUser(user)}
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg text-[#00D4B3] hover:bg-[#00D4B3]/10 dark:hover:bg-[#00D4B3]/20 transition-colors duration-200"
                                    title={tc('actions.edit')}
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    onClick={() => handleDeleteUser(user)}
                                    whileHover={{ scale: 1.1, rotate: -5 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors duration-200"
                                    title={tc('actions.delete')}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </motion.button>
                                </div>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveUser}
      />

      {deleteError && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {deleteError}
        </div>
      )}

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
