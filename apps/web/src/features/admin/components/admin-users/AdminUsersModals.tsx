'use client'

import dynamic from 'next/dynamic'
import type { AdminUser } from '../../services/adminUsers.service'
import type { NewAdminUserData } from '../AddUserModal'

const EditUserModal = dynamic(
  () => import('../EditUserModal').then((mod) => ({ default: mod.EditUserModal })),
  { ssr: false },
)
const DeleteUserModal = dynamic(
  () => import('../DeleteUserModal').then((mod) => ({ default: mod.DeleteUserModal })),
  { ssr: false },
)
const AddUserModal = dynamic(
  () => import('../AddUserModal').then((mod) => ({ default: mod.AddUserModal })),
  { ssr: false },
)

interface AdminUsersModalsProps {
  editingUser: AdminUser | null
  deletingUser: AdminUser | null
  isEditModalOpen: boolean
  isDeleteModalOpen: boolean
  isAddModalOpen: boolean
  onCloseEdit: () => void
  onCloseDelete: () => void
  onCloseAdd: () => void
  onSaveEdit: (userData: Partial<AdminUser>) => Promise<void>
  onConfirmDelete: () => Promise<void>
  onSaveNewUser: (userData: NewAdminUserData) => Promise<void>
}

export function AdminUsersModals(props: AdminUsersModalsProps) {
  return (
    <>
      <EditUserModal user={props.editingUser} isOpen={props.isEditModalOpen} onClose={props.onCloseEdit} onSave={props.onSaveEdit} />
      <DeleteUserModal user={props.deletingUser} isOpen={props.isDeleteModalOpen} onClose={props.onCloseDelete} onConfirm={props.onConfirmDelete} />
      <AddUserModal isOpen={props.isAddModalOpen} onClose={props.onCloseAdd} onSave={props.onSaveNewUser} />
    </>
  )
}
