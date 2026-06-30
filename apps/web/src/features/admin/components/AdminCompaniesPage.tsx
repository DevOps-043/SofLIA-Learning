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
      <AdminCompaniesGrid companies={logic.filteredCompanies} themeColors={logic.themeColors} onView={logic.setViewCompany} />
      <AdminCompaniesModals viewCompany={logic.viewCompany} showCreateModal={logic.showCreateModal} isCreating={logic.isCreating} themeColors={logic.themeColors} onCloseView={() => logic.setViewCompany(null)} onCloseCreate={() => logic.setShowCreateModal(false)} onCreateCompany={logic.handleCreateCompany} />
    </div>
  )
}
