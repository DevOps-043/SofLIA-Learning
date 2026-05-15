'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Clock3,
  PauseCircle,
  Zap,
} from 'lucide-react'

import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
import { useAdminCompaniesLogic } from '../hooks/useAdminCompaniesLogic'
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
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
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
      />

      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center gap-3 rounded-xl border p-4"
          style={{
            backgroundColor: `${theme.warningColor}10`,
            borderColor: `${theme.warningColor}30`,
          }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: theme.warningColor }} />
          <p className="text-sm" style={{ color: theme.warningColor }}>
            {actionError}
          </p>
        </motion.div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <AdminCompaniesStatCard
          title={t('companies.stats.active.title')}
          value={stats?.activeCompanies ?? 0}
          subtitle={t('companies.stats.active.subtitle', { total: stats?.totalCompanies ?? 0 })}
          icon={BadgeCheck}
          color={theme.successColor}
          delay={0}
        />
        <AdminCompaniesStatCard
          title={t('companies.stats.pending.title')}
          value={stats?.pendingCompanies ?? 0}
          subtitle={t('companies.stats.pending.subtitle')}
          icon={Clock3}
          color={theme.warningColor}
          delay={1}
        />
        <AdminCompaniesStatCard
          title={t('companies.stats.trial.title')}
          value={stats?.trialCompanies ?? 0}
          subtitle={t('companies.stats.trial.subtitle')}
          icon={Zap}
          color={theme.secondaryColor}
          delay={2}
        />
        <AdminCompaniesStatCard
          title={t('companies.stats.paused.title')}
          value={stats?.pausedCompanies ?? 0}
          subtitle={t('companies.stats.paused.subtitle')}
          icon={PauseCircle}
          color={theme.dangerColor}
          delay={3}
        />
        <AdminCompaniesStatCard
          title={t('companies.stats.avgUsage.title')}
          value={`${stats?.averageUtilization ?? 0}%`}
          subtitle={t('companies.stats.avgUsage.subtitle', { used: stats?.usedSeats ?? 0, total: stats?.totalSeats ?? 0 })}
          icon={BarChart3}
          color={theme.primaryColor}
          delay={4}
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
      />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
