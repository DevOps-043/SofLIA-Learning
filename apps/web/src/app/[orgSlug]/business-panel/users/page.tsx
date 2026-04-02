'use client'

import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Mail, Shield, CheckCircle, AlertCircle, Link2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ToastNotification } from '@/core/components/ToastNotification/ToastNotification'
import { useBusinessUsersPageLogic } from '@/features/business-panel/hooks/useBusinessUsersPageLogic'
import { StatCard } from './components/StatCard'
import { UserCard } from './components/UserCard'
import { InvitationCard } from './components/InvitationCard'
import { InvitationListRow } from './components/InvitationListRow'
import { EmptyState } from './components/EmptyState'
import { InviteLinkCard } from './components/InviteLinkCard'
import { InviteLinkRow } from './components/InviteLinkRow'
import { UserListRow } from './components/UserListRow'
import { UsersPageHeader } from './components/UsersPageHeader'
import { UsersFilterBar } from './components/UsersFilterBar'

const AddUserModal = dynamic(() => import('@/features/business-panel/components/BusinessAddUserModal').then(mod => ({ default: mod.BusinessAddUserModal })), { ssr: false })
const EditUserModal = dynamic(() => import('@/features/business-panel/components/BusinessEditUserModal').then(mod => ({ default: mod.BusinessEditUserModal })), { ssr: false })
const DeleteUserModal = dynamic(() => import('@/features/business-panel/components/BusinessDeleteUserModal').then(mod => ({ default: mod.BusinessDeleteUserModal })), { ssr: false })
const ImportUsersModal = dynamic(() => import('@/features/business-panel/components/BusinessImportUsersModal').then(mod => ({ default: mod.BusinessImportUsersModal })), { ssr: false })
const UserStatsModal = dynamic(() => import('@/features/business-panel/components/BusinessUserStatsModal').then((mod) => ({ default: mod.BusinessUserStatsModal })), { ssr: false })
const UnifiedInviteModal = dynamic(() => import('@/features/business-panel/components/BusinessUnifiedInviteModal').then(mod => ({ default: mod.BusinessUnifiedInviteModal })), { ssr: false })

export default function BusinessPanelUsersPage() {
  const { t } = useTranslation('business')
  const {
    orgSlug,
    users,
    invitations,
    inviteLinks,
    stats,
    orgData,
    isLoading,
    error,
    refetch,
    updateUser,
    filteredUsers,
    filteredInvitations,
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
    isDark,
    primaryColor,
    secondaryColor,
    accentColor,
  } = useBusinessUsersPageLogic()

  if (isLoading) {
    return (
      <div className="p-6 min-h-screen animate-pulse">
        <div className="h-48 rounded-3xl bg-gray-800/50 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-800/50 rounded-2xl" />)}
        </div>
        <div className="h-12 bg-gray-800/50 rounded-xl mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-800/50 rounded-2xl" />)}
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
    <div className="p-6 lg:p-8 space-y-8" style={{ color: 'var(--org-text-color, #FFFFFF)' }}>
      <UsersPageHeader
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
        isDark={isDark}
        t={t}
        onDownloadTemplate={handleDownloadTemplate}
        onImportClick={() => setIsImportModalOpen(true)}
        onInviteClick={() => setIsUnifiedInviteModalOpen(true)}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            <p className="text-sm text-amber-400">{t('users.error.loadFailed')}</p>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('users.stats.total')} value={stats.total} icon={<Users className="w-6 h-6" style={{ color: '#3B82F6' }} />} gradient="linear-gradient(135deg, #3B82F6, #1D4ED8)" delay={0} trend={12} isDark={isDark} />
        <StatCard title={t('users.stats.active')} value={stats.active} icon={<CheckCircle className="w-6 h-6" style={{ color: '#10B981' }} />} gradient="linear-gradient(135deg, #10B981, #059669)" delay={1} trend={8} isDark={isDark} />
        <StatCard title={t('users.stats.invited')} value={stats.invited} icon={<Mail className="w-6 h-6" style={{ color: '#F59E0B' }} />} gradient="linear-gradient(135deg, #F59E0B, #D97706)" delay={2} isDark={isDark} onClick={() => setActiveTab('invitations')} />
        <StatCard title={t('users.stats.admins')} value={stats.admins} icon={<Shield className="w-6 h-6" style={{ color: '#A855F7' }} />} gradient="linear-gradient(135deg, #A855F7, #7C3AED)" delay={3} trend={5} isDark={isDark} />
      </div>

      <UsersFilterBar
        activeTab={activeTab} setActiveTab={setActiveTab}
        users={users} invitations={invitations} inviteLinks={inviteLinks}
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        filterRole={filterRole} setFilterRole={setFilterRole}
        isRoleDropdownOpen={isRoleDropdownOpen} setIsRoleDropdownOpen={setIsRoleDropdownOpen}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        isStatusDropdownOpen={isStatusDropdownOpen} setIsStatusDropdownOpen={setIsStatusDropdownOpen}
        showAdvancedFilters={showAdvancedFilters} setShowAdvancedFilters={setShowAdvancedFilters}
        activeFiltersCount={activeFiltersCount} clearAllFilters={clearAllFilters}
        viewMode={viewMode} setViewMode={setViewMode}
        uniqueRegions={uniqueRegions} filterRegion={filterRegion} setFilterRegion={setFilterRegion}
        isRegionDropdownOpen={isRegionDropdownOpen} setIsRegionDropdownOpen={setIsRegionDropdownOpen}
        uniqueZones={uniqueZones} filterZone={filterZone} setFilterZone={setFilterZone}
        isZoneDropdownOpen={isZoneDropdownOpen} setIsZoneDropdownOpen={setIsZoneDropdownOpen}
        uniqueTeams={uniqueTeams} filterTeam={filterTeam} setFilterTeam={setFilterTeam}
        isTeamDropdownOpen={isTeamDropdownOpen} setIsTeamDropdownOpen={setIsTeamDropdownOpen}
        filteredUsers={filteredUsers}
        primaryColor={primaryColor} accentColor={accentColor} isDark={isDark} t={t}
      />

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' ? (
          filteredUsers.length === 0 ? (
            <EmptyState key="empty-users" onAddClick={() => setIsAddModalOpen(true)} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          ) : viewMode === 'cards' ? (
            <motion.div key="grid-users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
              {filteredUsers.map((user, index) => (
                <UserCard key={user.id} user={user} index={index} primaryColor={primaryColor}
                  onEdit={() => { setEditingUser(user); setIsEditModalOpen(true) }}
                  onDelete={() => { setDeletingUser(user); setIsDeleteModalOpen(true) }}
                  onStats={() => { setStatsUser(user); setIsStatsModalOpen(true) }}
                  onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                  onSuspend={user.org_status === 'active' ? () => suspendUser(user.id) : undefined}
                  onActivate={user.org_status === 'suspended' ? () => activateUser(user.id) : undefined}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div key="list-users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-2">{t('users.list.name', 'Nombre')}</div>
                <div>{t('users.list.hierarchy', 'Ubicación')}</div>
                <div>{t('users.list.role', 'Rol / Estado')}</div>
                <div className="text-right">{t('users.list.lastAccess', 'Último acceso')}</div>
              </div>
              {filteredUsers.map((user, index) => (
                <UserListRow key={user.id} user={user} index={index} primaryColor={primaryColor}
                  onEdit={() => { setEditingUser(user); setIsEditModalOpen(true) }}
                  onDelete={() => { setDeletingUser(user); setIsDeleteModalOpen(true) }}
                  onStats={() => { setStatsUser(user); setIsStatsModalOpen(true) }}
                  onResend={user.org_status === 'invited' ? () => resendInvitation(user.id) : undefined}
                  onSuspend={user.org_status === 'active' ? () => suspendUser(user.id) : undefined}
                  onActivate={user.org_status === 'suspended' ? () => activateUser(user.id) : undefined}
                />
              ))}
            </motion.div>
          )
        ) : activeTab === 'invitations' ? (
          filteredInvitations.length === 0 ? (
            <div key="empty-invitations" className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-white/5 bg-white/5">
              <Mail className="w-16 h-16 opacity-20 mb-4" />
              <h3 className="text-xl font-bold opacity-60">No hay invitaciones pendientes</h3>
              <p className="text-sm opacity-40 max-w-xs mx-auto mt-2">Todas tus invitaciones han sido aceptadas o no has enviado ninguna recientemente.</p>
            </div>
          ) : viewMode === 'cards' ? (
            <motion.div key="grid-invitations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvitations.map((inv, index) => (
                <InvitationCard key={inv.id} invitation={inv} index={index} primaryColor={primaryColor}
                  onResend={() => handleResendIndividualInvitation(inv.id)}
                  onRevoke={() => handleRevokeInvitation(inv.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div key="list-invitations" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-2">{t('users.list.invitation', 'Invitación')}</div>
                <div>{t('users.list.sent', 'Enviada')}</div>
                <div>{t('users.list.status', 'Estado')}</div>
                <div className="text-right">Acciones</div>
              </div>
              {filteredInvitations.map((inv, index) => (
                <InvitationListRow key={inv.id} invitation={inv} index={index} primaryColor={primaryColor}
                  onResend={() => handleResendIndividualInvitation(inv.id)}
                  onRevoke={() => handleRevokeInvitation(inv.id)}
                />
              ))}
            </motion.div>
          )
        ) : (
          inviteLinks.length === 0 ? (
            <div key="empty-links" className="flex flex-col items-center justify-center p-20 text-center rounded-3xl border border-white/5 bg-white/5">
              <Link2 className="w-16 h-16 opacity-20 mb-4" />
              <h3 className="text-xl font-bold opacity-60">No hay enlaces activos</h3>
              <p className="text-sm opacity-40 max-w-xs mx-auto mt-2">Crea enlaces de invitación masiva para compartir con grupos grandes.</p>
            </div>
          ) : viewMode === 'cards' ? (
            <motion.div key="grid-links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inviteLinks.map((link, index) => (
                <InviteLinkCard key={link.id} link={link} index={index} primaryColor={primaryColor}
                  onToggleStatus={() => updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')}
                  onDelete={() => deleteInviteLink(link.id)}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div key="list-links" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="hidden lg:grid grid-cols-5 gap-4 px-4 py-2 text-xs font-medium opacity-50 uppercase tracking-wider">
                <div className="col-span-1 lg:col-span-1">{t('users.list.link', 'Enlace')}</div>
                <div>{t('users.list.usage', 'Uso / Disponibles')}</div>
                <div>{t('users.list.expires', 'Vencimiento')}</div>
                <div className="text-right">Acciones</div>
              </div>
              {inviteLinks.map((link, index) => (
                <InviteLinkRow key={link.id} link={link} index={index} primaryColor={primaryColor}
                  onToggleStatus={() => updateInviteLinkStatus(link.id, link.status === 'active' ? 'pause' : 'resume')}
                  onDelete={() => deleteInviteLink(link.id)}
                />
              ))}
            </motion.div>
          )
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddUserModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleSaveNewUser} />
      <EditUserModal user={editingUser} isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setEditingUser(null) }} onSave={async (id, data) => { await updateUser(id, data) }} />
      <DeleteUserModal user={deletingUser} isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingUser(null) }} onConfirm={async () => { if (deletingUser) await deleteUser(deletingUser.id) }} />
      <ImportUsersModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportComplete={() => { refetch(); setIsImportModalOpen(false) }} />
      {statsUser && <UserStatsModal user={statsUser} isOpen={isStatsModalOpen} onClose={() => { setIsStatsModalOpen(false); setStatsUser(null) }} />}
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
