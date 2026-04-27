'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowPathIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'

import { useAdminCompaniesLogic } from '../hooks/useAdminCompaniesLogic'
import { useAdminTheme } from '../hooks/useAdminTheme'
import { AdminCreateCompanyModal } from './AdminCreateCompanyModal'
import { AdminEditCompanyModal } from './AdminEditCompanyModal'
import { AdminPageShell, AdminSurface } from './ui'
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
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
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
    <AdminPageShell className="py-6 lg:py-8" maxWidth="wide">
      <AdminCompaniesHeader
        onRefresh={refetch}
        onCreate={() => setShowCreateModal(true)}
      />

      {actionError ? (
        <AdminSurface
          className="mb-6 flex items-center gap-3 p-4"
          style={{
            backgroundColor: theme.warningSurface,
            borderColor: theme.warning,
          }}
        >
          <ExclamationTriangleIcon className="h-5 w-5" style={{ color: theme.warning }} />
          <p className="text-sm" style={{ color: theme.warning }}>
            {actionError}
          </p>
        </AdminSurface>
      ) : null}

      <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminCompaniesStatCard
          title={t('companies.stats.active.title')}
          value={stats?.activeCompanies ?? 0}
          subtitle={t('companies.stats.active.subtitle', { total: stats?.totalCompanies ?? 0 })}
          icon={CheckCircleIcon}
          color={theme.success}
          delay={0}
          themeColors={themeColors}
        />
        <AdminCompaniesStatCard
          title={t('companies.stats.pending.title')}
          value={stats?.pendingCompanies ?? 0}
          subtitle={t('companies.stats.pending.subtitle')}
          icon={ArrowPathIcon}
          color={theme.warning}
          delay={1}
          themeColors={themeColors}
        />
        <AdminCompaniesStatCard
          title={t('companies.stats.trial.title')}
          value={stats?.trialCompanies ?? 0}
          subtitle={t('companies.stats.trial.subtitle')}
          icon={BoltIcon}
          color={theme.info}
          delay={2}
          themeColors={themeColors}
        />
        <AdminCompaniesStatCard
          title={t('companies.stats.paused.title')}
          value={stats?.pausedCompanies ?? 0}
          subtitle={t('companies.stats.paused.subtitle')}
          icon={PauseCircleIcon}
          color={theme.warning}
          delay={3}
          themeColors={themeColors}
        />
        <AdminCompaniesStatCard
          title={t('companies.stats.avgUsage.title')}
          value={`${stats?.averageUtilization ?? 0}%`}
          subtitle={t('companies.stats.avgUsage.subtitle', { used: stats?.usedSeats ?? 0, total: stats?.totalSeats ?? 0 })}
          icon={ChartBarIcon}
          color={theme.accent}
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

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {filteredCompanies.length === 0 ? (
            <AdminCompaniesEmptyState themeColors={themeColors} />
          ) : (
            filteredCompanies.map((company, index) => (
              <motion.div
                key={company.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: index * 0.03 }}
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
        {viewCompany ? (
          <AdminCompanyViewModal
            company={viewCompany}
            onClose={() => setViewCompany(null)}
            onEdit={() => {
              setEditCompany(viewCompany)
              setViewCompany(null)
            }}
            themeColors={themeColors}
          />
        ) : null}
        {editCompany ? (
          <AdminEditCompanyModal
            company={editCompany}
            onClose={() => setEditCompany(null)}
            onSave={handleSaveEdit}
            isSaving={isSaving}
          />
        ) : null}
        {showCreateModal ? (
          <AdminCreateCompanyModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreateCompany}
            isCreating={isCreating}
          />
        ) : null}
      </AnimatePresence>
    </AdminPageShell>
  )
}
