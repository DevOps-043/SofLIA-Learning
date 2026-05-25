'use client'

import { useMemo } from 'react'
import { SofliaJoyride as Joyride } from '@/features/tours/components/SofliaJoyride'
import { useTranslation } from 'react-i18next'

import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useBusinessPanelTheme } from '@/features/business-panel/hooks/useBusinessPanelTheme'
import { useBusinessUsersPageLogic } from '@/features/business-panel/hooks/useBusinessUsersPageLogic'
import { StatCard } from './components/StatCard'
import { UserCard } from './components/UserCard'
import { InvitationCard } from './components/InvitationCard'
import { InvitationListRow } from './components/InvitationListRow'
import { EmptyState } from './components/EmptyState'
import { InviteLinkCard } from './components/InviteLinkCard'
import { InviteLinkRow } from './components/InviteLinkRow'
import { JoinRequestCard } from './components/JoinRequestCard'
import { JoinRequestListRow } from './components/JoinRequestListRow'
import { UserListRow } from './components/UserListRow'
import { UsersPageHeader } from './components/UsersPageHeader'
import { UsersFilterBar } from './components/UsersFilterBar'
import { JoyrideClient } from '@/features/tours/components/JoyrideClient'
import { useFeatureTour } from '@/features/tours/hooks/useFeatureTour'

import { BusinessUsersErrorBanner } from './components/BusinessUsersErrorBanner'
import { BusinessUsersLoadingState } from './components/BusinessUsersLoadingState'
import { UsersDynamicModals } from './components/UsersDynamicModals'
import { UsersFilterSection } from './components/UsersFilterSection'
import { UsersPageHeader } from './components/UsersPageHeader'
import { UsersPagination } from './components/UsersPagination'
import { UsersStatsGrid } from './components/UsersStatsGrid'
import { UsersTabContent } from './components/UsersTabContent'

export default function BusinessPanelUsersPage() {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const logic = useBusinessUsersPageLogic()
  const tourSteps = useMemo(() => getAdminUsersSteps(t), [t])
  const { joyrideProps } = useFeatureTour({
    tourId: ADMIN_USERS_TOUR_ID,
    steps: tourSteps,
    enabled: !logic.isLoading,
  })

  if (logic.isLoading) {
    return <BusinessUsersLoadingState />
  }

  return (
    <>
      {joyrideProps.run ? <JoyrideClient {...joyrideProps} /> : null}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8" style={{ color: theme.textColor }}>
      <UsersPageHeader
        t={t}
        onDownloadTemplate={handleDownloadTemplate}
        onImportClick={() => setIsImportModalOpen(true)}
        onInviteClick={() => setIsUnifiedInviteModalOpen(true)}
        onAddClick={() => setIsAddModalOpen(true)}
        onRefresh={refetch}
        isRefreshing={isLoading}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border"
          style={{
            backgroundColor: `${theme.warningColor}10`,
            borderColor: `${theme.warningColor}25`,
          }}
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5" style={{ color: theme.warningColor }} />
            <p className="text-sm" style={{ color: theme.warningColor }}>
              {t('users.error.loadFailed')}
            </p>
          </div>
        </motion.div>
      )}

      <div id="tour-users-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title={t('users.stats.total')}
          value={stats.total}
          icon={<Users className="w-5 h-5" />}
          iconColor={theme.brandColor}
          delay={0}
          trend={12}
        />
        <StatCard
          title={t('users.stats.active')}
          value={stats.active}
          icon={<CheckCircle className="w-5 h-5" />}
          iconColor={theme.successColor}
          delay={1}
          trend={8}
        />
        <StatCard
          title={t('users.stats.invited')}
          value={stats.invited}
          icon={<Mail className="w-5 h-5" />}
          iconColor={theme.warningColor}
          delay={2}
          onClick={() => setActiveTab('invitations')}
        />
        <StatCard
          title={t('users.stats.admins')}
          value={stats.admins}
          icon={<Shield className="w-5 h-5" />}
          iconColor={theme.secondaryColor}
          delay={3}
          trend={5}
        />
        <StatCard
          title={t('sidebar.joinRequests', 'Solicitudes')}
          value={joinRequestsCount}
          icon={<UserPlus className="w-5 h-5" />}
          iconColor={theme.actionColor}
          delay={4}
          onClick={() => setActiveTab('requests')}
        />
      </div>

      <div id="tour-users-filters">
        <UsersFilterBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          totalCounts={{
            users: resourceTotals.users,
            invitations: resourceTotals.invitations,
            inviteLinks: resourceTotals.inviteLinks,
            joinRequests: joinRequestsCount,
          }}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterRole={filterRole}
          setFilterRole={setFilterRole}
          isRoleDropdownOpen={isRoleDropdownOpen}
          setIsRoleDropdownOpen={setIsRoleDropdownOpen}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          isStatusDropdownOpen={isStatusDropdownOpen}
          setIsStatusDropdownOpen={setIsStatusDropdownOpen}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          activeFiltersCount={activeFiltersCount}
          clearAllFilters={clearAllFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          uniqueRegions={uniqueRegions}
          filterRegion={filterRegion}
          setFilterRegion={setFilterRegion}
          isRegionDropdownOpen={isRegionDropdownOpen}
          setIsRegionDropdownOpen={setIsRegionDropdownOpen}
          uniqueZones={uniqueZones}
          filterZone={filterZone}
          setFilterZone={setFilterZone}
          isZoneDropdownOpen={isZoneDropdownOpen}
          setIsZoneDropdownOpen={setIsZoneDropdownOpen}
          uniqueTeams={uniqueTeams}
          filterTeam={filterTeam}
          setFilterTeam={setFilterTeam}
          isTeamDropdownOpen={isTeamDropdownOpen}
          setIsTeamDropdownOpen={setIsTeamDropdownOpen}
          filteredUsers={filteredUsers}
          filteredInvitations={filteredInvitations}
          filteredInviteLinks={filteredInviteLinks}
          filteredJoinRequests={filteredJoinRequests}
          t={t}
          onDownloadTemplate={downloadUsersTemplate}
          onImportClick={() => logic.setIsImportModalOpen(true)}
          onInviteClick={() => logic.setIsUnifiedInviteModalOpen(true)}
          onAddClick={() => logic.setIsAddModalOpen(true)}
          onRefresh={logic.refetch}
          isRefreshing={logic.isLoading}
        />

        <BusinessUsersErrorBanner error={logic.error} theme={theme} />
        <UsersStatsGrid logic={logic} theme={theme} />
        <UsersFilterSection logic={logic} />
        <UsersTabContent logic={logic} theme={theme} />

        {logic.activeTab !== 'requests' && logic.activePagination.totalPages > 1 ? (
          <UsersPagination
            page={logic.activePagination.page}
            totalPages={logic.activePagination.totalPages}
            total={logic.activePagination.total}
            onPageChange={(page) => {
              const resource =
                logic.activeTab === 'invitations' || logic.activeTab === 'links'
                  ? logic.activeTab
                  : 'users'
              logic.setResourcePage(resource, page)
            }}
          />
        ) : null}

        <UsersDynamicModals logic={logic} />
        <ToastNotification
          isOpen={logic.toast.isOpen}
          onClose={() => logic.setToast({ ...logic.toast, isOpen: false })}
          message={logic.toast.message}
          type={logic.toast.type}
        />
      </div>
    </>
  )
}

async function downloadUsersTemplate() {
  const response = await fetch('/api/business/users/template', { credentials: 'include' })
  if (!response.ok) return

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'plantilla-importacion-usuarios.csv'
  anchor.click()
}
