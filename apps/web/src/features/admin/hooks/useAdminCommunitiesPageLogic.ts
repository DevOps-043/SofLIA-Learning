'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminCommunities } from './useAdminCommunities'
import type { AdminCommunity } from '../services/adminCommunities.service'
import { filterAdminCommunities } from '../services/admin-communities-filter.service'
import type { AdminCommunitiesViewMode, AdminCommunityMutationInput } from '../components/admin-communities'

export function useAdminCommunitiesPageLogic() {
  const router = useRouter()
  const { communities, stats, isLoading, error, refetch } = useAdminCommunities()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState<AdminCommunitiesViewMode>('grid')
  const [editingCommunity, setEditingCommunity] = useState<AdminCommunity | null>(null)
  const [deletingCommunity, setDeletingCommunity] = useState<AdminCommunity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const filteredCommunities = useMemo(() => {
    return filterAdminCommunities(communities, {
      searchTerm,
      category: filterCategory,
      status: filterStatus,
    })
  }, [communities, filterCategory, filterStatus, searchTerm])

  const handleEditCommunity = (community: AdminCommunity) => {
    setEditingCommunity(community)
    setIsEditModalOpen(true)
  }

  const handleDeleteCommunity = (community: AdminCommunity) => {
    setDeletingCommunity(community)
    setIsDeleteModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingCommunity(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingCommunity(null)
  }

  const handleViewCommunity = (community: AdminCommunity) => {
    router.push(`/admin/communities/${community.slug}`)
  }

  const handleToggleVisibility = async (community: AdminCommunity) => {
    const response = await fetch(`/api/admin/communities/${community.id}/toggle-visibility`, {
      method: 'PATCH'
    })

    if (!response.ok) {
      throw new Error('Error al actualizar la visibilidad de la comunidad')
    }

    refetch()
  }

  const handleSaveCommunity = async (communityData: AdminCommunityMutationInput) => {
    if (!editingCommunity) {
      return
    }

    const response = await fetch(`/api/admin/communities/${editingCommunity.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(communityData)
    })

    if (!response.ok) {
      throw new Error('Error al actualizar comunidad')
    }

    closeEditModal()
    refetch()
  }

  const handleConfirmDelete = async () => {
    if (!deletingCommunity) {
      return
    }

    const response = await fetch(`/api/admin/communities/${deletingCommunity.id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Error al eliminar comunidad')
    }

    closeDeleteModal()
    refetch()
  }

  const handleSaveNewCommunity = async (communityData: AdminCommunityMutationInput) => {
    const response = await fetch('/api/admin/communities/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(communityData)
    })
    const data = await response.json()

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Error al crear la comunidad')
    }

    setIsAddModalOpen(false)
    refetch()
  }

  return {
    communities,
    filteredCommunities,
    stats,
    isLoading,
    error,
    refetch,
    searchTerm,
    setSearchTerm,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    editingCommunity,
    deletingCommunity,
    isEditModalOpen,
    isDeleteModalOpen,
    isAddModalOpen,
    setIsEditModalOpen,
    setIsDeleteModalOpen,
    setIsAddModalOpen,
    closeEditModal,
    closeDeleteModal,
    handleEditCommunity,
    handleDeleteCommunity,
    handleViewCommunity,
    handleToggleVisibility,
    handleSaveCommunity,
    handleConfirmDelete,
    handleSaveNewCommunity,
  }
}
