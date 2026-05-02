'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminWorkshops } from './useAdminWorkshops'
import type { AdminWorkshop } from '../services/adminWorkshops.service'
import {
  deleteAdminWorkshop,
  filterAdminWorkshops,
  updateAdminWorkshop,
} from '../components/admin-workshops/admin-workshops-display.service'

export function useAdminWorkshopsPageLogic() {
  const router = useRouter()
  const { workshops, stats, isLoading, error, refetch } = useAdminWorkshops()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [editingWorkshop, setEditingWorkshop] = useState<AdminWorkshop | null>(
    null,
  )
  const [workshopToDelete, setWorkshopToDelete] =
    useState<AdminWorkshop | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const filteredWorkshops = useMemo(
    () =>
      filterAdminWorkshops(workshops, {
        searchTerm,
        category: filterCategory,
        status: filterStatus,
      }),
    [filterCategory, filterStatus, searchTerm, workshops],
  )

  const openAddModal = () => {
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
  }

  const openEditModal = (workshop: AdminWorkshop) => {
    setEditingWorkshop(workshop)
  }

  const closeEditModal = () => {
    setEditingWorkshop(null)
  }

  const openDeleteModal = (workshop: AdminWorkshop) => {
    setWorkshopToDelete(workshop)
  }

  const closeDeleteModal = () => {
    setWorkshopToDelete(null)
  }

  const handleViewWorkshop = (workshop: AdminWorkshop) => {
    router.push(`/admin/workshops/${workshop.id}`)
  }

  const handleWorkshopCreated = async () => {
    await refetch()
    closeAddModal()
  }

  const handleWorkshopUpdated = async (data: unknown) => {
    if (!editingWorkshop) {
      return
    }

    try {
      setIsUpdating(true)
      await updateAdminWorkshop(editingWorkshop.id, data)
      await refetch()
      closeEditModal()
    } catch (error) {
      console.error('Error updating workshop:', error)
      // En el futuro, implementar sistema de feedback local como en CourseManagement
    } finally {
      setIsUpdating(false)
    }
  }

  const handleWorkshopDeleted = async () => {
    if (!workshopToDelete) {
      return
    }

    try {
      await deleteAdminWorkshop(workshopToDelete.id)
      await refetch()
      closeDeleteModal()
    } catch (error) {
      console.error('Error deleting workshop:', error)
      // En el futuro, implementar sistema de feedback local como en CourseManagement
    }
  }

  return {
    workshops,
    filteredWorkshops,
    stats,
    isLoading,
    error,
    isUpdating,
    isAddModalOpen,
    editingWorkshop,
    workshopToDelete,
    searchTerm,
    filterCategory,
    filterStatus,
    setSearchTerm,
    setFilterCategory,
    setFilterStatus,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    handleViewWorkshop,
    handleWorkshopCreated,
    handleWorkshopUpdated,
    handleWorkshopDeleted,
    refetch,
  }
}
