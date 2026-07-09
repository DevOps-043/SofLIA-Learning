'use client'

import { useAuth } from '@/features/auth/hooks/useAuth'
import { SectionWrapper } from './shared'
import { InviteLinksTable } from './users-section/InviteLinksTable'
import { InvitationsTable } from './users-section/InvitationsTable'
import { MembersTable } from './users-section/MembersTable'
import type { UsersSectionProps } from './users-section/types'
import { UsersEmptyState } from './users-section/UsersEmptyState'
import { UsersSectionCard } from './users-section/UsersSectionCard'
import { UsersSectionModals } from './users-section/UsersSectionModals'
import { UsersStatsCards } from './users-section/UsersStatsCards'
import { UsersSubTabs } from './users-section/UsersSubTabs'
import { useUsersSectionState } from './users-section/useUsersSectionState'

function UsersSection(props: UsersSectionProps) {
  const state = useUsersSectionState(props)
  const { data: currentUser } = useAuth()
  const activeItems =
    state.activeSubTab === 'members'
      ? state.filteredMembers
      : state.activeSubTab === 'invitations'
        ? state.filteredInvitations
        : state.filteredLinks

  return (
    <SectionWrapper>
      <UsersStatsCards company={props.company} />
      <UsersSubTabs activeSubTab={state.activeSubTab} onChange={state.setActiveSubTab} />
      <UsersSectionCard
        activeSubTab={state.activeSubTab}
        count={activeItems.length}
        roleFilter={state.roleFilter}
        searchTerm={state.searchTerm}
        onInvite={() => state.setIsInviteModalOpen(true)}
        onRoleFilterChange={state.setRoleFilter}
        onSearchTermChange={state.setSearchTerm}
      >
        {state.activeSubTab === 'members' ? (
          <MembersTable
            members={state.filteredMembers}
            actionsDisabled={!state.orgSlug}
            onViewStats={state.openStats}
            onEditProfile={state.openEditProfile}
            onManageAssignments={(member) => {
              state.setManageMember(member)
              state.setManageMode('assignments')
            }}
            onDelete={(member) => {
              state.setManageMember(member)
              state.setManageMode('delete')
            }}
          />
        ) : null}
        {state.activeSubTab === 'invitations' ? (
          <InvitationsTable
            invitations={state.filteredInvitations}
            resendingId={state.resendingId}
            revokingId={state.revokingId}
            onResend={state.handleResendInvitation}
            onRevoke={state.setInvitationToRevoke}
          />
        ) : null}
        {state.activeSubTab === 'links' ? (
          <InviteLinksTable
            links={state.filteredLinks}
            onCopy={(token) => {
              const url = `${window.location.origin}/register?invite=${token}`
              navigator.clipboard.writeText(url)
              state.setModalConfig({
                isOpen: true,
                type: 'success',
                title: '¡Copiado!',
                message: 'Enlace copiado al portapapeles',
              })
            }}
          />
        ) : null}
        {activeItems.length === 0 ? <UsersEmptyState /> : null}
      </UsersSectionCard>
      <UsersSectionModals
        company={props.company}
        invitationToRevoke={state.invitationToRevoke}
        isInviteModalOpen={state.isInviteModalOpen}
        isRevoking={state.revokingId !== null}
        manageMode={state.manageMode}
        manageMember={state.manageMember}
        modalConfig={state.modalConfig}
        onCloseInvite={() => state.setIsInviteModalOpen(false)}
        onCloseManage={() => {
          state.setManageMode(null)
          state.setManageMember(null)
        }}
        onCloseModal={() => state.setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onCloseRevoke={() => state.setInvitationToRevoke(null)}
        onConfirmRevoke={state.confirmRevokeInvitation}
        onUpdate={props.onUpdate}
        businessUsersById={state.businessUsersById}
        statsMember={state.statsMember}
        isStatsModalOpen={state.isStatsModalOpen}
        onCloseStats={state.closeStats}
        viewerUserId={currentUser?.id}
        profileMember={state.profileMember}
        isEditProfileModalOpen={state.isEditProfileModalOpen}
        onCloseEditProfile={state.closeEditProfile}
        onSaveProfile={state.handleSaveProfile}
      />
    </SectionWrapper>
  )
}

export { UsersSection }
