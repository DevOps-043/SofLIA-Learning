'use client'

import { AddWorkshopModal } from './AddWorkshopModal'
import { DeleteWorkshopModal } from './DeleteWorkshopModal'
import { EditWorkshopModal } from './EditWorkshopModal'
import { PageShell } from '@/core/layout'
import {
  AdminWorkshopsEmptyState,
  AdminWorkshopsErrorState,
  AdminWorkshopsFilters,
  AdminWorkshopsGrid,
  AdminWorkshopsHeader,
  AdminWorkshopsLoadingState,
  AdminWorkshopsStatsGrid,
} from './admin-workshops'
import { useAdminWorkshopsPageLogic } from '../hooks'

export function AdminWorkshopsPage() {
  const {
    filteredWorkshops,
    stats,
    isLoading,
    error,
    isUpdating,
    isAddModalOpen,
    editingWorkshop,
    workshopToDelete,
    searchTerm,
    filterCategory,
    filterStatus,
    setSearchTerm,
    setFilterCategory,
    setFilterStatus,
    openAddModal,
    closeAddModal,
    closeEditModal,
    closeDeleteModal,
    openEditModal,
    openDeleteModal,
    handleViewWorkshop,
    handleWorkshopCreated,
    handleWorkshopUpdated,
    handleWorkshopDeleted,
    refetch,
  } = useAdminWorkshopsPageLogic()

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    filterCategory !== 'all' ||
    filterStatus !== 'all'

  if (isLoading) {
    return <AdminWorkshopsLoadingState />
  }

  if (error) {
    return <AdminWorkshopsErrorState error={error} onRetry={refetch} />
  }

  return (
    <PageShell spacing="relaxed">
      <AdminWorkshopsHeader onCreateWorkshop={openAddModal} />
      <AdminWorkshopsStatsGrid stats={stats} />
      <AdminWorkshopsFilters
        searchTerm={searchTerm}
        filterCategory={filterCategory}
        filterStatus={filterStatus}
        onSearchChange={setSearchTerm}
        onCategoryChange={setFilterCategory}
        onStatusChange={setFilterStatus}
      />

      {filteredWorkshops.length === 0 ? (
        <AdminWorkshopsEmptyState hasActiveFilters={hasActiveFilters} />
      ) : (
        <AdminWorkshopsGrid
          workshops={filteredWorkshops}
          onView={handleViewWorkshop}
          onEdit={openEditModal}
          onDelete={openDeleteModal}
        />
      )}

      <AddWorkshopModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSave={handleWorkshopCreated}
      />

      <EditWorkshopModal
        workshop={editingWorkshop}
        onClose={closeEditModal}
        onSave={handleWorkshopUpdated}
      />

      <DeleteWorkshopModal
        isOpen={Boolean(workshopToDelete)}
        onClose={closeDeleteModal}
        workshop={workshopToDelete}
        onConfirm={handleWorkshopDeleted}
      />
    </PageShell>
  )
}
