'use client'

import { PageShell } from '@/core/layout'
import { useAdminWorkshopsPageLogic } from '../hooks'
import {
  AdminWorkshopsEmptyState,
  AdminWorkshopsErrorState,
  AdminWorkshopsFilters,
  AdminWorkshopsGrid,
  AdminWorkshopsHeader,
  AdminWorkshopsLoadingState,
  AdminWorkshopsModals,
  AdminWorkshopsPagination,
  AdminWorkshopsStatsGrid,
} from './admin-workshops'

export function AdminWorkshopsPage() {
  const logic = useAdminWorkshopsPageLogic()
  const hasActiveFilters =
    logic.searchTerm.trim().length > 0 ||
    logic.filterCategory !== 'all' ||
    logic.filterStatus !== 'all'

  if (logic.isLoading) return <AdminWorkshopsLoadingState />
  if (logic.error) return <AdminWorkshopsErrorState error={logic.error} onRetry={logic.refetch} />

  return (
    <PageShell spacing="relaxed">
      <AdminWorkshopsHeader onCreateWorkshop={logic.openAddModal} />
      <AdminWorkshopsStatsGrid stats={logic.stats} />
      <AdminWorkshopsFilters searchTerm={logic.searchTerm} filterCategory={logic.filterCategory} filterStatus={logic.filterStatus} onSearchChange={logic.setSearchTerm} onCategoryChange={logic.setFilterCategory} onStatusChange={logic.setFilterStatus} />
      {logic.filteredWorkshops.length === 0 ? <AdminWorkshopsEmptyState hasActiveFilters={hasActiveFilters} /> : <AdminWorkshopsGrid workshops={logic.filteredWorkshops} onView={logic.handleViewWorkshop} onEdit={logic.openEditModal} onDelete={logic.openDeleteModal} />}
      <AdminWorkshopsPagination page={logic.page} total={logic.pagination.total} totalPages={logic.pagination.totalPages} isLoading={logic.isLoading} onPageChange={logic.setPage} />
      <AdminWorkshopsModals isAddModalOpen={logic.isAddModalOpen} editingWorkshop={logic.editingWorkshop} workshopToDelete={logic.workshopToDelete} onCloseAdd={logic.closeAddModal} onCloseEdit={logic.closeEditModal} onCloseDelete={logic.closeDeleteModal} onSaveCreate={logic.handleWorkshopCreated} onSaveEdit={logic.handleWorkshopUpdated} onConfirmDelete={logic.handleWorkshopDeleted} />
    </PageShell>
  )
}
