'use client'

import { useCallback, useState } from 'react'
import type { AdminUser } from '../../services/adminUsers.service'
import type { MasterPanelTab } from './master-panel/types'
import type { AdminRoleFilter, AdminUsersViewMode } from './types'

/**
 * Estado de UI del directorio de usuarios.
 *
 * Busqueda y rol NO se filtran aqui: viajan al servidor como parametros de
 * consulta. Filtrarlos en memoria solo veia la pagina actual, asi que cualquier
 * usuario fuera del primer lote resultaba invisible e imposible de buscar.
 */
export function useAdminUsersPageState() {
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

  return {
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
