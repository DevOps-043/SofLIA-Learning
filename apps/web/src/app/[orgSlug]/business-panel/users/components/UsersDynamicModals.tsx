'use client'

import dynamic from 'next/dynamic'

import type { BusinessUsersPageLogic } from './users-page.types'

const AddUserModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessAddUserModal').then((mod) => ({
      default: mod.BusinessAddUserModal,
    })),
  { ssr: false },
)
const EditUserModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessEditUserModal').then((mod) => ({
      default: mod.BusinessEditUserModal,
    })),
  { ssr: false },
)
const DeleteUserModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessDeleteUserModal').then((mod) => ({
      default: mod.BusinessDeleteUserModal,
    })),
  { ssr: false },
)
const ImportUsersModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessImportUsersModal').then((mod) => ({
      default: mod.BusinessImportUsersModal,
    })),
  { ssr: false },
)
const UserStatsModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessUserStatsModal').then((mod) => ({
      default: mod.BusinessUserStatsModal,
    })),
  { ssr: false },
)
const UnifiedInviteModal = dynamic(
  () =>
    import('@/features/business-panel/components/BusinessUnifiedInviteModal').then((mod) => ({
      default: mod.BusinessUnifiedInviteModal,
    })),
  { ssr: false },
)

export function UsersDynamicModals({ logic }: { logic: BusinessUsersPageLogic }) {
  return (
    <>
      <AddUserModal isOpen={logic.isAddModalOpen} onClose={() => logic.setIsAddModalOpen(false)} onSave={logic.handleSaveNewUser} />
      <EditUserModal
        user={logic.editingUser}
        isOpen={logic.isEditModalOpen}
        onClose={() => {
          logic.setIsEditModalOpen(false)
          logic.setEditingUser(null)
        }}
        onSave={async (id, data) => {
          await logic.updateUser(id, data)
        }}
      />
      <DeleteUserModal
        user={logic.deletingUser}
        isOpen={logic.isDeleteModalOpen}
        onClose={() => {
          logic.setIsDeleteModalOpen(false)
          logic.setDeletingUser(null)
        }}
        onConfirm={async () => {
          if (logic.deletingUser) await logic.deleteUser(logic.deletingUser.id)
        }}
      />
      <ImportUsersModal
        isOpen={logic.isImportModalOpen}
        onClose={() => logic.setIsImportModalOpen(false)}
        onImportComplete={() => {
          logic.refetch()
          logic.setIsImportModalOpen(false)
        }}
      />
      {logic.statsUser ? (
        <UserStatsModal user={logic.statsUser} isOpen={logic.isStatsModalOpen} onClose={() => {
          logic.setIsStatsModalOpen(false)
          logic.setStatsUser(null)
        }} orgSlug={logic.orgSlug} />
      ) : null}
      <UnifiedInviteModal
        isOpen={logic.isUnifiedInviteModalOpen}
        onClose={() => logic.setIsUnifiedInviteModalOpen(false)}
        onInviteSent={() => logic.refetch()}
        onLinkCreated={() => logic.refetch()}
        organizationId={logic.orgData?.id || undefined}
        organizationSlug={logic.orgSlug}
      />
    </>
  )
}
