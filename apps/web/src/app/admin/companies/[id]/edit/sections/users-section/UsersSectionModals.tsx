'use client'

import { ConfirmationModal } from '@/features/admin/components/ConfirmationModal'
import { AdminMemberManageModal } from '@/features/admin/components/AdminMemberManageModal'
import { AdminUnifiedInviteModal } from '@/features/admin/components/AdminUnifiedInviteModal'
import { ErrorModal } from '@/core/components/ErrorModal/ErrorModal'
import { SuccessModal } from '@/core/components/SuccessModal/SuccessModal'
import { colors } from '../shared'
import type { CompanyData } from '@/features/admin/hooks/useEditCompanyLogic'
import type { UsersModalConfig } from './types'

interface UsersSectionModalsProps {
  company: CompanyData
  invitationToRevoke: string | null
  isInviteModalOpen: boolean
  isRevoking: boolean
  manageMode: 'edit' | 'delete' | null
  manageMember: CompanyData['members'][number] | null
  modalConfig: UsersModalConfig
  onCloseInvite: () => void
  onCloseManage: () => void
  onCloseModal: () => void
  onCloseRevoke: () => void
  onConfirmRevoke: () => void
  onUpdate: () => void
}

export function UsersSectionModals(props: UsersSectionModalsProps) {
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

      <AdminMemberManageModal
        isOpen={props.manageMode !== null}
        onClose={props.onCloseManage}
        onUpdate={props.onUpdate}
        member={props.manageMember}
        companyId={props.company.id}
        mode={props.manageMode}
        primaryColor={colors.primary}
        accentColor={colors.accent}
      />

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
