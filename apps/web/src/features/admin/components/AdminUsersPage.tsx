'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/core/providers/I18nProvider'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useAdminUserStatsFilters } from '../hooks/useAdminUserStatsFilters'
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
import { createAdminUser, deleteAdminUser } from './admin-users/admin-users-api'
import { prefetchMasterPanelData } from './admin-users/master-panel/master-panel-api'
import { MASTER_PANEL_TABS, type MasterPanelTab } from './admin-users/master-panel/types'

// El Panel Maestro embebe BusinessUserAnalyticsPageClient (charts, PDF, AI
// insights) en su tab de estadísticas — el mismo árbol pesado detrás del viejo
// modal de estadísticas. Solo se muestra tras abrir el panel de un usuario, así
// que no debe formar parte del bundle eager de /admin/users (el tab de stats
// además anida su propio dynamic import para no cargar charts en otros tabs).
const UserMasterPanel = dynamic(
  () => import('./admin-users/master-panel').then((mod) => mod.UserMasterPanel),
  { ssr: false },
)

function isMasterPanelTab(value: string | null): value is MasterPanelTab {
  return Boolean(value) && (MASTER_PANEL_TABS as string[]).includes(value as string)
}

export function AdminUsersPage() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { language } = useLanguage()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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

  // Deep-link: /admin/users?panelUser=<id>&panelTab=<tab> abre el Panel Maestro
  // al cargar (una sola vez, cuando el directorio ya tiene al usuario).
  const deepLinkHandled = useRef(false)
  useEffect(() => {
    if (deepLinkHandled.current || users.length === 0) return
    const panelUserId = searchParams.get('panelUser')
    if (!panelUserId) {
      deepLinkHandled.current = true
      return
    }
    const targetUser = users.find((user) => user.id === panelUserId)
    if (targetUser) {
      const tabParam = searchParams.get('panelTab')
      state.openPanel(targetUser, isMasterPanelTab(tabParam) ? tabParam : 'profile')
    }
    deepLinkHandled.current = true
  }, [users, searchParams, state])

  const syncPanelUrl = (user: AdminUser | null, tab?: MasterPanelTab) => {
    const params = new URLSearchParams(searchParams.toString())
    if (user) {
      params.set('panelUser', user.id)
      params.set('panelTab', tab ?? 'profile')
    } else {
      params.delete('panelUser')
      params.delete('panelTab')
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  const openMasterPanel = (user: AdminUser, tab: MasterPanelTab) => {
    state.openPanel(user, tab)
    syncPanelUrl(user, tab)
  }

  const closeMasterPanel = () => {
    state.closePanel()
    syncPanelUrl(null)
  }

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

  const handleDeleteUser = (user: AdminUser) => {
    state.setDeletingUser(user)
    state.setIsDeleteModalOpen(true)
  }

  // "Eliminar" desde la zona de riesgo del Panel Maestro: se cierra el panel
  // y se reutiliza el modal de borrado existente (mismas validaciones y cascada).
  const handleRequestDeleteFromPanel = (user: AdminUser) => {
    closeMasterPanel()
    handleDeleteUser(user)
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
        <AdminUsersResults users={state.filteredUsers} hasFilters={state.hasFilters || hasDirectoryFilters} viewMode={state.viewMode} locale={language} onAddClick={() => state.setIsAddModalOpen(true)} onClearFilters={clearAllFilters} onEditUser={(user) => openMasterPanel(user, 'profile')} onDeleteUser={handleDeleteUser} onViewStats={(user) => openMasterPanel(user, 'stats')} onUserHover={(user) => prefetchMasterPanelData(user.id)} t={t} tc={tc} />
      </div>
      <AdminUsersModals deletingUser={state.deletingUser} isDeleteModalOpen={state.isDeleteModalOpen} isAddModalOpen={state.isAddModalOpen} onCloseDelete={() => { state.setIsDeleteModalOpen(false); state.setDeletingUser(null) }} onCloseAdd={() => state.setIsAddModalOpen(false)} onConfirmDelete={handleConfirmDelete} onSaveNewUser={handleSaveNewUser} />
      {state.panelUser ? (
        <UserMasterPanel
          user={state.panelUser}
          isOpen={Boolean(state.panelUser)}
          initialTab={state.panelInitialTab}
          defaultOrganizationId={organizationFilter || null}
          organizationLabel={companyLabel}
          onClose={closeMasterPanel}
          onUserSaved={refetch}
          onRequestDelete={handleRequestDeleteFromPanel}
        />
      ) : null}
    </div>
  )
}
