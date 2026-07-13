'use client'

import dynamic from 'next/dynamic'
import type { AdminUser } from '../../services/adminUsers.service'
import type { NewAdminUserData } from '../AddUserModal'

const DeleteUserModal = dynamic(
  () => import('../DeleteUserModal').then((mod) => ({ default: mod.DeleteUserModal })),
  { ssr: false },
)
const AddUserModal = dynamic(
  () => import('../AddUserModal').then((mod) => ({ default: mod.AddUserModal })),
  { ssr: false },
)

interface AdminUsersModalsProps {
  deletingUser: AdminUser | null
  isDeleteModalOpen: boolean
  isAddModalOpen: boolean
  onCloseDelete: () => void
  onCloseAdd: () => void
  onConfirmDelete: () => Promise<void>
  onSaveNewUser: (userData: NewAdminUserData) => Promise<void>
}

export function AdminUsersModals(props: AdminUsersModalsProps) {
  return (
    <>
      <DeleteUserModal user={props.deletingUser} isOpen={props.isDeleteModalOpen} onClose={props.onCloseDelete} onConfirm={props.onConfirmDelete} />
      <AddUserModal isOpen={props.isAddModalOpen} onClose={props.onCloseAdd} onSave={props.onSaveNewUser} />
    </>
  )
}
