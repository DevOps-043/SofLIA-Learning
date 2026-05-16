'use client'

import { useMemo, useState } from 'react'
import { getAdminUserDisplayConfig } from './service'
import type { AdminUser } from '../../services/adminUsers.service'
import type { AdminRoleFilter, AdminUsersViewMode } from './types'

export function useAdminUsersPageState(users: AdminUser[]) {
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

  return {
    filteredUsers,
    hasFilters: searchTerm.trim().length > 0 || roleFilter !== 'all',
    searchTerm,
    roleFilter,
    viewMode,
    editingUser,
    deletingUser,
    isEditModalOpen,
    isDeleteModalOpen,
    isAddModalOpen,
    isRefreshing,
    setSearchTerm,
    setRoleFilter,
    setViewMode,
    setEditingUser,
    setDeletingUser,
    setIsEditModalOpen,
    setIsDeleteModalOpen,
    setIsAddModalOpen,
    setIsRefreshing,
  }
}
