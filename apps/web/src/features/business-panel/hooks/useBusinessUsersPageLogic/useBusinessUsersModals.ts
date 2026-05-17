import { useState } from 'react'
import type { BusinessUser } from '@/features/business-panel/services/businessUsers.service'

export function useBusinessUsersModals() {
  const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<BusinessUser | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [statsUser, setStatsUser] = useState<BusinessUser | null>(null)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [isUnifiedInviteModalOpen, setIsUnifiedInviteModalOpen] = useState(false)

  return {
    editingUser, setEditingUser, deletingUser, setDeletingUser, isEditModalOpen,
    setIsEditModalOpen, isDeleteModalOpen, setIsDeleteModalOpen, isAddModalOpen,
    setIsAddModalOpen, isImportModalOpen, setIsImportModalOpen, statsUser,
    setStatsUser, isStatsModalOpen, setIsStatsModalOpen,
    isUnifiedInviteModalOpen, setIsUnifiedInviteModalOpen,
  }
}
