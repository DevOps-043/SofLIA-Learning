'use client'

import { useAdminCompaniesLogic } from '../hooks/useAdminCompaniesLogic'
import {
  AdminCompaniesActionError,
  AdminCompaniesErrorState,
  AdminCompaniesFilters,
  AdminCompaniesGrid,
  AdminCompaniesHeader,
  AdminCompaniesLoadingState,
  AdminCompaniesModals,
  AdminCompaniesStatsSection,
} from './admin-companies'

export function AdminCompaniesPage() {
  const logic = useAdminCompaniesLogic()

  if (logic.isLoading) return <AdminCompaniesLoadingState themeColors={logic.themeColors} />
  if (logic.error) return <AdminCompaniesErrorState error={logic.error} onRetry={logic.refetch} themeColors={logic.themeColors} />

  return (
    <div className="min-h-screen p-6 transition-colors duration-300 lg:p-8" style={{ backgroundColor: logic.themeColors.background }}>
      <AdminCompaniesHeader isRefreshing={logic.isRefreshing} onRefresh={logic.refetch} onCreate={() => logic.setShowCreateModal(true)} />
      {logic.actionError ? <AdminCompaniesActionError message={logic.actionError} /> : null}
      <AdminCompaniesStatsSection stats={logic.stats} />
      <AdminCompaniesFilters searchTerm={logic.searchTerm} planFilter={logic.planFilter} statusFilter={logic.statusFilter} filteredCount={logic.filteredCompanies.length} onSearchChange={logic.setSearchTerm} onPlanChange={logic.setPlanFilter} onStatusChange={logic.setStatusFilter} />
      <AdminCompaniesGrid companies={logic.filteredCompanies} updatingId={logic.updatingId} themeColors={logic.themeColors} onView={logic.setViewCompany} onEdit={logic.setEditCompany} onToggle={logic.handleToggle} onActivate={logic.handleActivatePending} />
      <AdminCompaniesModals viewCompany={logic.viewCompany} editCompany={logic.editCompany} showCreateModal={logic.showCreateModal} isSaving={logic.isSaving} isCreating={logic.isCreating} themeColors={logic.themeColors} onCloseView={() => logic.setViewCompany(null)} onOpenEditFromView={() => { if (logic.viewCompany) logic.setEditCompany(logic.viewCompany); logic.setViewCompany(null) }} onCloseEdit={() => logic.setEditCompany(null)} onCloseCreate={() => logic.setShowCreateModal(false)} onSaveEdit={logic.handleSaveEdit} onCreateCompany={logic.handleCreateCompany} />
    </div>
  )
}
