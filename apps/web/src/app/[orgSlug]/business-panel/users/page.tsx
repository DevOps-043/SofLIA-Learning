'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  CheckCircle,
  Link2,
  Loader2,
  Mail,
  Shield,
  UserPlus,
  Users,
} from 'lucide-react'
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

const AddUserModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessAddUserModal').then((mod) => ({
      default: mod.BusinessAddUserModal,
    })),
  { ssr: false }
)
const EditUserModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessEditUserModal').then((mod) => ({
      default: mod.BusinessEditUserModal,
    })),
  { ssr: false }
)
const DeleteUserModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessDeleteUserModal').then((mod) => ({
      default: mod.BusinessDeleteUserModal,
    })),
  { ssr: false }
)
const ImportUsersModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessImportUsersModal').then((mod) => ({
      default: mod.BusinessImportUsersModal,
    })),
  { ssr: false }
)
const UserStatsModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessUserStatsModal').then((mod) => ({
      default: mod.BusinessUserStatsModal,
    })),
  { ssr: false }
)
const UnifiedInviteModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessUnifiedInviteModal').then((mod) => ({
      default: mod.BusinessUnifiedInviteModal,
    })),
  { ssr: false }
)

export default function BusinessPanelUsersPage() {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const {
    orgSlug,
    joinRequestsCount,
    stats,
    orgData,
    isLoading,
    error,
    isJoinRequestsLoading,
    joinRequestsError,
    refetch,
    activePagination,
    resourceTotals,
    setResourcePage,
    updateUser,
    filteredUsers,
    filteredInvitations,
    filteredInviteLinks,
    filteredJoinRequests,
    uniqueRegions,
    uniqueZones,
    uniqueTeams,
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    filterRegion,
    setFilterRegion,
    filterZone,
    setFilterZone,
    filterTeam,
    setFilterTeam,
    showAdvancedFilters,
    setShowAdvancedFilters,
    activeFiltersCount,
    clearAllFilters,
    isRoleDropdownOpen,
    setIsRoleDropdownOpen,
    isStatusDropdownOpen,
    setIsStatusDropdownOpen,
    isRegionDropdownOpen,
    setIsRegionDropdownOpen,
    isZoneDropdownOpen,
    setIsZoneDropdownOpen,
    isTeamDropdownOpen,
    setIsTeamDropdownOpen,
    editingUser,
    setEditingUser,
    deletingUser,
    setDeletingUser,
    isEditModalOpen,
    setIsEditModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isAddModalOpen,
    setIsAddModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    statsUser,
    setStatsUser,
    isStatsModalOpen,
    setIsStatsModalOpen,
    isUnifiedInviteModalOpen,
    setIsUnifiedInviteModalOpen,
    toast,
    setToast,
    handleSaveNewUser,
    resendInvitation,
    suspendUser,
    activateUser,
    deleteUser,
    updateInviteLinkStatus,
    deleteInviteLink,
    handleResendIndividualInvitation,
    handleRevokeInvitation,
    reviewJoinRequest,
    reviewingId,
  } = useBusinessUsersPageLogic()

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen animate-pulse">
        <div className="h-48 rounded-3xl bg-gray-200 dark:bg-gray-800/50 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800/50 rounded-2xl" />
          ))}
        </div>
        <div className="h-12 bg-gray-200 dark:bg-gray-800/50 rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800/50 rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const handleDownloadTemplate = async () => {
    const response = await fetch('/api/business/users/template', { credentials: 'include' })
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla-importacion-usuarios.csv'
      a.click()
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8" style={{ color: theme.textColor }}>
      <UsersPageHeader
        t={t}
        onDownloadTemplate={handleDownloadTemplate}
        onImportClick={() => setIsImportModalOpen(true)}
        onInviteClick={() => setIsUnifiedInviteModalOpen(true)}
        onAddClick={() => setIsAddModalOpen(true)}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
      />

      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          filteredUsers.length === 0 ? (
            <EmptyState key="empty-users" onAddClick={() => setIsAddModalOpen(true)} />
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredUsers.map((user, index) => (
                <UserCard
                  key={user.id}
                  user={user}
                  index={index}
                  onEdit={() => {
                    setEditingUser(user)
                    setIsEditModalOpen(true)
                  }}
                  onDelete={() => {
                    setDeletingUser(user)
                    setIsDeleteModalOpen(true)
                  }}
                  onStats={() => {
                    setStatsUser(user)
                    setIsStatsModalOpen(true)
                  }}
                  onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                  onSuspend={user.org_status === 'active' ? () => suspendUser(user.id) : undefined}
                  onActivate={user.org_status === 'suspended' ? () => activateUser(user.id) : undefined}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-2">{t('users.list.name', 'Nombre')}</div>
                <div>{t('users.list.hierarchy', 'Ubicación')}</div>
                <div>{t('users.list.role', 'Rol / Estado')}</div>
                <div className="text-right">{t('users.list.lastAccess', 'Último acceso')}</div>
              </div>
              {filteredUsers.map((user, index) => (
                <UserListRow
                  key={user.id}
                  user={user}
                  index={index}
                  onEdit={() => {
                    setEditingUser(user)
                    setIsEditModalOpen(true)
                  }}
                  onDelete={() => {
                    setDeletingUser(user)
                    setIsDeleteModalOpen(true)
                  }}
                  onStats={() => {
                    setStatsUser(user)
                    setIsStatsModalOpen(true)
                  }}
                  onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                />
              ))}
            </motion.div>
          )
        ) : activeTab === 'invitations' ? (
          filteredInvitations.length === 0 ? (
            <ManagementTabEmptyState
              key="empty-invitations"
              theme={theme}
              icon={<Mail className="w-16 h-16" />}
              title="No hay invitaciones pendientes"
              description="Todas tus invitaciones han sido aceptadas o no has enviado ninguna recientemente."
            />
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-invitations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredInvitations.map((inv, index) => (
                <InvitationCard
                  key={inv.id}
                  invitation={inv}
                  index={index}
                  onResend={() => handleResendIndividualInvitation(inv.id)}
                  onRevoke={() => handleRevokeInvitation(inv.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-invitations"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-2">{t('users.list.invitation', 'Invitación')}</div>
                <div>{t('users.list.sent', 'Enviada')}</div>
                <div>{t('users.list.status', 'Estado')}</div>
                <div className="text-right">Acciones</div>
              </div>
              {filteredInvitations.map((inv, index) => (
                <InvitationListRow
                  key={inv.id}
                  invitation={inv}
                  index={index}
                  onResend={() => handleResendIndividualInvitation(inv.id)}
                  onRevoke={() => handleRevokeInvitation(inv.id)}
                />
              ))}
            </motion.div>
          )
        ) : activeTab === 'links' ? (
          filteredInviteLinks.length === 0 ? (
            <ManagementTabEmptyState
              key="empty-links"
              theme={theme}
              icon={<Link2 className="w-16 h-16" />}
              title="No hay enlaces activos"
              description="Crea enlaces de invitación masiva para compartir con grupos grandes."
            />
          ) : viewMode === 'cards' ? (
            <motion.div
              key="grid-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredInviteLinks.map((link, index) => (
                <InviteLinkCard
                  key={link.id}
                  link={link}
                  index={index}
                  onToggleStatus={() =>
                    updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')
                  }
                  onDelete={() => deleteInviteLink(link.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list-links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2"
            >
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div>{t('users.list.link', 'Enlace')}</div>
                <div>{t('users.list.usage', 'Uso / Disponibles')}</div>
                <div>{t('users.list.expires', 'Vencimiento')}</div>
                <div className="text-right">Acciones</div>
              </div>
              {filteredInviteLinks.map((link, index) => (
                <InviteLinkRow
                  key={link.id}
                  link={link}
                  index={index}
                  onToggleStatus={() =>
                    updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')
                  }
                  onDelete={() => deleteInviteLink(link.id)}
                />
              ))}
            </motion.div>
          )
        ) : isJoinRequestsLoading ? (
          <div
            key="loading-requests"
            className="rounded-3xl border p-12 text-center"
            style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
          >
            <Loader2
              className="w-10 h-10 animate-spin mx-auto mb-4"
              style={{ color: theme.actionColor }}
            />
            <p style={{ color: theme.subtextColor }}>Cargando solicitudes...</p>
          </div>
        ) : joinRequestsError ? (
          <div
            key="error-requests"
            className="rounded-3xl border p-6"
            style={{
              backgroundColor: `${theme.dangerColor}10`,
              borderColor: `${theme.dangerColor}20`,
              color: theme.dangerColor,
            }}
          >
            {joinRequestsError}
          </div>
        ) : filteredJoinRequests.length === 0 ? (
          <ManagementTabEmptyState
            key="empty-requests"
            theme={theme}
            icon={<UserPlus className="w-16 h-16" />}
            title="No hay solicitudes pendientes"
            description="Las solicitudes para unirse a la organización aparecerán aquí."
          />
        ) : viewMode === 'cards' ? (
          <motion.div
            key="grid-requests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredJoinRequests.map((request, index) => (
              <JoinRequestCard
                key={request.id}
                request={request}
                index={index}
                isReviewing={reviewingId === request.id}
                onApprove={() => reviewJoinRequest(request.id, 'approve')}
                onReject={() => reviewJoinRequest(request.id, 'reject')}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list-requests"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
              <div className="col-span-2">Solicitud</div>
              <div>Mensaje</div>
              <div>Estado</div>
              <div className="text-right">Acciones</div>
            </div>
            {filteredJoinRequests.map((request, index) => (
              <JoinRequestListRow
                key={request.id}
                request={request}
                index={index}
                isReviewing={reviewingId === request.id}
                onApprove={() => reviewJoinRequest(request.id, 'approve')}
                onReject={() => reviewJoinRequest(request.id, 'reject')}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab !== 'requests' && activePagination.totalPages > 1 && (
        <UsersPagination
          page={activePagination.page}
          totalPages={activePagination.totalPages}
          total={activePagination.total}
          onPageChange={(page) => {
            const resource = activeTab === 'invitations' || activeTab === 'links' ? activeTab : 'users'
            setResourcePage(resource, page)
          }}
        />
      )}

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewUser}
      />
      <EditUserModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingUser(null)
        }}
        onSave={async (id, data) => {
          await updateUser(id, data)
        }}
      />
      <DeleteUserModal
        user={deletingUser}
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setDeletingUser(null)
        }}
        onConfirm={async () => {
          if (deletingUser) {
            await deleteUser(deletingUser.id)
          }
        }}
      />
      <ImportUsersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={() => {
          refetch()
          setIsImportModalOpen(false)
        }}
      />
      {statsUser && (
        <UserStatsModal
          user={statsUser}
          isOpen={isStatsModalOpen}
          onClose={() => {
            setIsStatsModalOpen(false)
            setStatsUser(null)
          }}
          orgSlug={orgSlug}
        />
      )}
      <UnifiedInviteModal
        isOpen={isUnifiedInviteModalOpen}
        onClose={() => setIsUnifiedInviteModalOpen(false)}
        onInviteSent={() => refetch()}
        onLinkCreated={() => refetch()}
        organizationId={orgData?.id || undefined}
        organizationSlug={orgSlug}
      />

      <ToastNotification
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  )
}

function UsersPagination({
  page,
  totalPages,
  total,
  onPageChange,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
}) {
  const { t } = useTranslation('business')
  const theme = useBusinessPanelTheme()
  const canGoBack = page > 1
  const canGoForward = page < totalPages

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border px-4 py-3"
      style={{ backgroundColor: theme.cardBg, borderColor: theme.borderColor }}
    >
      <p className="text-sm" style={{ color: theme.subtextColor }}>
        {t('users.pagination.summary', {
          count: total,
          page,
          totalPages,
          defaultValue: '{{count}} resultados - pagina {{page}} de {{totalPages}}',
        })}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => onPageChange(page - 1)}
          className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            borderColor: theme.borderColor,
            color: theme.textColor,
            backgroundColor: theme.inputBg,
          }}
        >
          {t('users.pagination.previous', { defaultValue: 'Anterior' })}
        </button>
        <button
          type="button"
          disabled={!canGoForward}
          onClick={() => onPageChange(page + 1)}
          className="rounded-xl px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            color: theme.onPrimaryColor,
            backgroundColor: theme.primaryColor,
          }}
        >
          {t('users.pagination.next', { defaultValue: 'Siguiente' })}
        </button>
      </div>
    </div>
  )
}

function ManagementTabEmptyState({
  theme,
  icon,
  title,
  description,
}: {
  theme: ReturnType<typeof useBusinessPanelTheme>
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div
      className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="mb-4" style={{ color: theme.mutedTextColor }}>
        {icon}
      </div>
      <h3 className="text-xl font-bold" style={{ color: theme.textColor }}>
        {title}
      </h3>
      <p className="text-sm max-w-xs mx-auto mt-2" style={{ color: theme.subtextColor }}>
        {description}
      </p>
    </div>
  )
}
