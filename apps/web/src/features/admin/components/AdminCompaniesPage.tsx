'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline'

import { useAdminCompaniesLogic } from '../hooks/useAdminCompaniesLogic'
import { adminCompaniesColors } from '../services/admin-companies'
import { AdminCreateCompanyModal } from './AdminCreateCompanyModal'
import { AdminEditCompanyModal } from './AdminEditCompanyModal'
import {
  AdminCompaniesEmptyState,
  AdminCompaniesErrorState,
  AdminCompaniesFilters,
  AdminCompaniesHeader,
  AdminCompaniesLoadingState,
  AdminCompaniesStatCard,
  AdminCompanyCard,
  AdminCompanyViewModal,
} from './admin-companies'

export function AdminCompaniesPage() {
  const {
    stats,
    isLoading,
    error,
    refetch,
    updatingId,
    actionError,
    searchTerm,
    setSearchTerm,
    planFilter,
    setPlanFilter,
    statusFilter,
    setStatusFilter,
    viewCompany,
    setViewCompany,
    editCompany,
    setEditCompany,
    isSaving,
    showCreateModal,
    setShowCreateModal,
    isCreating,
    themeColors,
    filteredCompanies,
    handleToggle,
    handleActivatePending,
    handleSaveEdit,
    handleCreateCompany,
  } = useAdminCompaniesLogic()

  if (isLoading) {
    return <AdminCompaniesLoadingState themeColors={themeColors} />
  }

  if (error) {
    return <AdminCompaniesErrorState error={error} onRetry={refetch} themeColors={themeColors} />
  }

  return (
    <div
      className="min-h-screen p-6 transition-colors duration-300 lg:p-8"
      style={{ backgroundColor: themeColors.background }}
    >
      <AdminCompaniesHeader
        onRefresh={refetch}
        onCreate={() => setShowCreateModal(true)}
        themeColors={themeColors}
      />

      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-xl border p-4"
          style={{
            backgroundColor: `${adminCompaniesColors.warning}10`,
            borderColor: `${adminCompaniesColors.warning}30`,
          }}
        >
          <ExclamationTriangleIcon className="h-5 w-5" style={{ color: adminCompaniesColors.warning }} />
          <p className="text-sm" style={{ color: adminCompaniesColors.warning }}>
            {actionError}
          </p>
        </motion.div>
      )}

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
        <AdminCompaniesStatCard
          title="Empresas Activas"
          value={stats?.activeCompanies ?? 0}
          subtitle={`de ${stats?.totalCompanies ?? 0} registradas`}
          icon={CheckCircleIcon}
          color={adminCompaniesColors.success}
          delay={0}
          themeColors={themeColors}
        />
        <AdminCompaniesStatCard
          title="Pendientes"
          value={stats?.pendingCompanies ?? 0}
          subtitle="Requieren activacion"
          icon={ArrowPathIcon}
          color={adminCompaniesColors.pending}
          delay={1}
          themeColors={themeColors}
        />
        <AdminCompaniesStatCard
          title="En Trial"
          value={stats?.trialCompanies ?? 0}
          subtitle="Conversiones prioritarias"
          icon={BoltIcon}
          color={adminCompaniesColors.purple}
          delay={2}
          themeColors={themeColors}
        />
        <AdminCompaniesStatCard
          title="Pausadas"
          value={stats?.pausedCompanies ?? 0}
          subtitle="Revisar facturacion"
          icon={PauseCircleIcon}
          color={adminCompaniesColors.warning}
          delay={3}
          themeColors={themeColors}
        />
        <AdminCompaniesStatCard
          title="Uso Promedio"
          value={`${stats?.averageUtilization ?? 0}%`}
          subtitle={`${stats?.usedSeats ?? 0} / ${stats?.totalSeats ?? 0} licencias`}
          icon={ChartBarIcon}
          color={adminCompaniesColors.accent}
          delay={4}
          themeColors={themeColors}
        />
      </section>

      <AdminCompaniesFilters
        searchTerm={searchTerm}
        planFilter={planFilter}
        statusFilter={statusFilter}
        filteredCount={filteredCompanies.length}
        onSearchChange={setSearchTerm}
        onPlanChange={setPlanFilter}
        onStatusChange={setStatusFilter}
        themeColors={themeColors}
      />

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredCompanies.length === 0 ? (
            <AdminCompaniesEmptyState themeColors={themeColors} />
          ) : (
            filteredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <AdminCompanyCard
                  company={company}
                  onView={() => setViewCompany(company)}
                  onEdit={() => setEditCompany(company)}
                  onToggle={() => handleToggle(company)}
                  onActivate={() => handleActivatePending(company)}
                  isUpdating={updatingId === company.id}
                  themeColors={themeColors}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </section>

      <AnimatePresence>
        {viewCompany && (
          <AdminCompanyViewModal
            company={viewCompany}
            onClose={() => setViewCompany(null)}
            onEdit={() => {
              setEditCompany(viewCompany)
              setViewCompany(null)
            }}
            themeColors={themeColors}
          />
        )}
        {editCompany && (
          <AdminEditCompanyModal
            company={editCompany}
            onClose={() => setEditCompany(null)}
            onSave={handleSaveEdit}
            isSaving={isSaving}
          />
        )}
        {showCreateModal && (
          <AdminCreateCompanyModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateCompany}
            isCreating={isCreating}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
