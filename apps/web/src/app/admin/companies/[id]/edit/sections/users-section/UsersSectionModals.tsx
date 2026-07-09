'use client'

import { ConfirmationModal } from '@/features/admin/components/ConfirmationModal'
import { AdminMemberManageModal } from '@/features/admin/components/AdminMemberManageModal'
import { AdminMemberDetailModal } from '@/features/admin/components/AdminMemberDetailModal'
import { AdminUnifiedInviteModal } from '@/features/admin/components/AdminUnifiedInviteModal'
import { ErrorModal } from '@/core/components/ErrorModal/ErrorModal'
import { SuccessModal } from '@/core/components/SuccessModal/SuccessModal'
import { BusinessUserStatsModal } from '@/features/business-panel/components/BusinessUserStatsModal'
import { BusinessEditUserModal } from '@/features/business-panel/components/business-edit-user-modal'
import { OrganizationStylesProvider } from '@/features/business-panel/contexts/OrganizationStylesContext'
import type { BusinessUser, UpdateBusinessUserRequest } from '@/features/business-panel/services/businessUsers.service'
import { colors } from '../shared'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'
import type { UsersModalConfig } from './types'

interface UsersSectionModalsProps {
  company: CompanyData
  invitationToRevoke: string | null
  isInviteModalOpen: boolean
  isRevoking: boolean
  manageMode: 'assignments' | 'delete' | null
  manageMember: CompanyData['members'][number] | null
  modalConfig: UsersModalConfig
  onCloseInvite: () => void
  onCloseManage: () => void
  onCloseModal: () => void
  onCloseRevoke: () => void
  onConfirmRevoke: () => void
  onUpdate: () => void
  businessUsersById: Map<string, BusinessUser>
  statsMember: CompanyData['members'][number] | null
  isStatsModalOpen: boolean
  onCloseStats: () => void
  viewerUserId?: string
  profileMember: CompanyData['members'][number] | null
  isEditProfileModalOpen: boolean
  onCloseEditProfile: () => void
  onSaveProfile: (userId: string, data: UpdateBusinessUserRequest) => Promise<void>
}

export function UsersSectionModals(props: UsersSectionModalsProps) {
  const orgSlug = props.company.slug || undefined
  const statsUser = props.statsMember ? props.businessUsersById.get(props.statsMember.user_id) || null : null
  const profileUser = props.profileMember ? props.businessUsersById.get(props.profileMember.user_id) || null : null

  return (
    <>
      <AdminUnifiedInviteModal
        isOpen={props.isInviteModalOpen}
        onClose={props.onCloseInvite}
        organizationId={props.company.id}
        organizationSlug={props.company.slug || undefined}
        onInviteSent={props.onUpdate}
        onLinkCreated={props.onUpdate}
        primaryColor={colors.primary}
        accentColor={colors.accent}
      />

      <AdminMemberDetailModal
        isOpen={props.manageMode === 'assignments'}
        onClose={props.onCloseManage}
        onUpdate={props.onUpdate}
        member={props.manageMember}
        companyId={props.company.id}
      />

      <AdminMemberManageModal
        isOpen={props.manageMode === 'delete'}
        onClose={props.onCloseManage}
        onUpdate={props.onUpdate}
        member={props.manageMember}
        companyId={props.company.id}
        mode="delete"
        primaryColor={colors.primary}
        accentColor={colors.accent}
      />

      <OrganizationStylesProvider orgSlug={orgSlug}>
        <BusinessUserStatsModal
          user={statsUser}
          isOpen={props.isStatsModalOpen}
          onClose={props.onCloseStats}
          orgSlug={orgSlug}
          viewerUserId={props.viewerUserId}
        />

        <BusinessEditUserModal
          user={profileUser}
          isOpen={props.isEditProfileModalOpen}
          onClose={props.onCloseEditProfile}
          onSave={props.onSaveProfile}
          orgSlug={orgSlug}
        />
      </OrganizationStylesProvider>

      <SuccessModal
        isOpen={props.modalConfig.isOpen && props.modalConfig.type === 'success'}
        onClose={props.onCloseModal}
        title={props.modalConfig.title}
        message={props.modalConfig.message}
      />

      <ErrorModal
        isOpen={props.modalConfig.isOpen && props.modalConfig.type === 'error'}
        onClose={props.onCloseModal}
        title={props.modalConfig.title}
        message={props.modalConfig.message}
      />

      <ConfirmationModal
        isOpen={props.invitationToRevoke !== null}
        onClose={props.onCloseRevoke}
        onConfirm={props.onConfirmRevoke}
        title="Eliminar Invitación"
        message="¿Estás seguro de que deseas eliminar esta invitación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        isLoading={props.isRevoking}
      />
    </>
  )
}
