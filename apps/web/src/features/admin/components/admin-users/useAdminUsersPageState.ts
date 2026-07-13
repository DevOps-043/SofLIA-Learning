'use client'

import { useCallback, useMemo, useState } from 'react'
import { getAdminUserDisplayConfig } from './service'
import type { AdminUser } from '../../services/adminUsers.service'
import type { MasterPanelTab } from './master-panel/types'
import type { AdminRoleFilter, AdminUsersViewMode } from './types'

export function useAdminUsersPageState(users: AdminUser[]) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<AdminRoleFilter>('all')
  const [viewMode, setViewMode] = useState<AdminUsersViewMode>('cards')
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Panel Maestro: sustituye a los antiguos modales de edición y estadísticas.
  const [panelUser, setPanelUser] = useState<AdminUser | null>(null)
  const [panelInitialTab, setPanelInitialTab] = useState<MasterPanelTab>('profile')

  const openPanel = useCallback((user: AdminUser, tab: MasterPanelTab = 'profile') => {
    setPanelInitialTab(tab)
    setPanelUser(user)
  }, [])

  const closePanel = useCallback(() => setPanelUser(null), [])

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

  return {
    filteredUsers,
    hasFilters: searchTerm.trim().length > 0 || roleFilter !== 'all',
    searchTerm,
    roleFilter,
    viewMode,
    deletingUser,
    isDeleteModalOpen,
    isAddModalOpen,
    isRefreshing,
    panelUser,
    panelInitialTab,
    openPanel,
    closePanel,
    setSearchTerm,
    setRoleFilter,
    setViewMode,
    setDeletingUser,
    setIsDeleteModalOpen,
    setIsAddModalOpen,
    setIsRefreshing,
  }
}
