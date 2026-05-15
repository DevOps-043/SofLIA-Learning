'use client'

import { useTranslation } from 'react-i18next'
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
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'

export function AdminWorkshopsPage() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const {
    filteredWorkshops,
    pagination,
    page,
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
    setPage,
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

      {pagination.totalPages > 1 ? (
        <div
          className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm sm:flex-row"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
            color: theme.subtextColor,
          }}
        >
          <span>
            {t('workshops.pagination.total', { count: pagination.total })}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(page - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-xl border px-3 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: theme.inputBg,
                borderColor: theme.borderColor,
                color: theme.textColor,
              }}
            >
              {t('workshops.pagination.previous')}
            </button>
            <span
              className="min-w-24 text-center font-semibold"
              style={{ color: theme.textColor }}
            >
              {page} / {pagination.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(Math.min(page + 1, pagination.totalPages))}
              disabled={page >= pagination.totalPages || isLoading}
              className="rounded-xl border px-3 py-2 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                backgroundColor: theme.primaryColor,
                borderColor: theme.primaryColor,
                color: theme.onPrimaryColor,
              }}
            >
              {t('workshops.pagination.next')}
            </button>
          </div>
        </div>
      ) : null}

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
