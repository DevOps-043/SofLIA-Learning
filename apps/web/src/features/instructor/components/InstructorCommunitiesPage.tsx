'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { 
  UserGroupIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { useInstructorCommunities } from '../hooks/useInstructorCommunities'
import { InstructorCommunity } from '../services/instructorCommunities.service'
import { useRouter } from 'next/navigation'

// Lazy loading de modales de Communities
const EditCommunityModal = dynamic(() => import('../../admin/components/EditCommunityModal').then(mod => ({ default: mod.EditCommunityModal })), {
  ssr: false
})

const DeleteCommunityModal = dynamic(() => import('../../admin/components/DeleteCommunityModal').then(mod => ({ default: mod.DeleteCommunityModal })), {
  ssr: false
})

const AddCommunityModal = dynamic(() => import('../../admin/components/AddCommunityModal').then(mod => ({ default: mod.AddCommunityModal })), {
  ssr: false
})

export function InstructorCommunitiesPage() {
  const router = useRouter()
  const { communities, stats, isLoading, error, refetch } = useInstructorCommunities()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  
  // Estados para modales
  const [editingCommunity, setEditingCommunity] = useState<InstructorCommunity | null>(null)
  const [deletingCommunity, setDeletingCommunity] = useState<InstructorCommunity | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)


  // Funciones para manejar las acciones de las comunidades
  const handleEditCommunity = (community: InstructorCommunity) => {
    setEditingCommunity(community)
    setIsEditModalOpen(true)
  }

  const handleDeleteCommunity = (community: InstructorCommunity) => {
    setDeletingCommunity(community)
    setIsDeleteModalOpen(true)
  }

  const handleViewCommunity = (community: InstructorCommunity) => {
    router.push(`/instructor/communities/${community.slug}`)
  }

  const handleToggleVisibility = async (community: InstructorCommunity) => {
    try {
      const response = await fetch(`/api/admin/communities/${community.id}/toggle-visibility`, {
        method: 'PATCH'
      })
      
      if (response.ok) {
        refetch() // Recargar los datos
      }
    } catch (error) {
    }
  }

  const handleSaveCommunity = async (communityData: any) => {
    try {
      const response = await fetch(`/api/admin/communities/${editingCommunity?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(communityData)
      })
      
      if (response.ok) {
        refetch() // Recargar los datos
      } else {
        throw new Error('Error al actualizar comunidad')
      }
    } catch (error) {
      throw error
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCommunity) return
    
    try {
      const response = await fetch(`/api/admin/communities/${deletingCommunity.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        refetch() // Recargar los datos
      } else {
        throw new Error('Error al eliminar comunidad')
      }
    } catch (error) {
      throw error
    }
  }

  const handleAddCommunity = () => {
    setIsAddModalOpen(true)
  }

  const handleSaveNewCommunity = async (communityData: any) => {
    try {
      
      // ✅ Ahora usamos el endpoint de instructor que crea solicitudes en lugar de comunidades directamente
      const response = await fetch('/api/instructor/communities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...communityData,
          visibility: communityData.visibility || 'public',
          access_type: communityData.access_type || 'open'
        })
      })
      
      
      const data = await response.json()
      
      if (response.ok && data.success) {
        // Mostrar mensaje de éxito con el mensaje del servidor
        alert(data.message || 'Se ha enviado la solicitud para crear la comunidad al Administrador. Recibirás una notificación cuando sea aprobada.')
        closeAddModal() // Cerrar el modal
        // No recargar datos ya que aún no hay comunidad creada, solo una solicitud
      } else {
        throw new Error(data.message || data.error || 'Error al crear la solicitud de comunidad')
      }
    } catch (error) {
      throw error
    }
  }

  // Funciones para cerrar modales
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingCommunity(null)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingCommunity(null)
  }

  const closeAddModal = () => {
    setIsAddModalOpen(false)
  }

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (community.creator_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    // Para categorías, usaremos la visibilidad o access_type como categoría
    const communityCategory = community.visibility === 'private' ? 'Privada' : 
                             community.access_type === 'moderated' ? 'Moderada' : 'Pública'
    const matchesCategory = filterCategory === 'all' || communityCategory === filterCategory
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && community.is_active) ||
                         (filterStatus === 'inactive' && !community.is_active)
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pública':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'Privada':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      case 'Moderada':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="h-9 bg-gray-700 rounded-xl w-64 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-700 rounded w-96 animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-700 rounded-xl w-48 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded w-16"></div>
                </div>
                <div className="h-12 w-12 bg-gray-700 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-700/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Comunidades</h1>
            <p className="text-gray-400 text-sm">Administra y gestiona todas tus comunidades publicadas</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl shadow-lg border border-red-500/30 p-8">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-full bg-red-500/20 mb-4">
              <XCircleIcon className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-red-400 mb-2">Error al cargar comunidades</h3>
            <p className="text-gray-400 mb-6">{error}</p>
            <button 
              onClick={refetch} 
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl shadow-lg shadow-red-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-red-500/30 font-medium"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header mejorado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gestión de Comunidades</h1>
          <p className="text-gray-400 text-sm">Administra y gestiona todas tus comunidades publicadas</p>
        </div>
        <button 
          onClick={handleAddCommunity}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30 font-medium"
        >
          <PlusIcon className="h-5 w-5" />
          Crear Comunidad
        </button>
      </div>

      {/* Estadísticas mejoradas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 hover:border-blue-500/50 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">Total Comunidades</p>
              <p className="text-3xl font-bold text-white mb-2">{stats?.totalCommunities || 0}</p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 group-hover:from-blue-500/30 group-hover:to-blue-600/20 transition-all">
              <UserGroupIcon className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 hover:border-green-500/50 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">Total Miembros</p>
              <p className="text-3xl font-bold text-white mb-2">{stats?.totalMembers || 0}</p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 group-hover:from-green-500/30 group-hover:to-green-600/20 transition-all">
              <UsersIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 hover:border-purple-500/50 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">Total Posts</p>
              <p className="text-3xl font-bold text-white mb-2">{stats?.totalPosts || 0}</p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 group-hover:from-purple-500/30 group-hover:to-purple-600/20 transition-all">
              <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6 hover:border-orange-500/50 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-400 mb-1">Comunidades Activas</p>
              <p className="text-3xl font-bold text-white mb-2">{stats?.activeCommunities || 0}</p>
            </div>
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 group-hover:from-orange-500/30 group-hover:to-orange-600/20 transition-all">
              <ShieldCheckIcon className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda mejorados */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar comunidades por nombre, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 pr-10 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all appearance-none backdrop-blur-sm cursor-pointer"
              >
                <option value="all">Todas las categorías</option>
                <option value="Pública">Pública</option>
                <option value="Privada">Privada</option>
                <option value="Moderada">Moderada</option>
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all backdrop-blur-sm cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de comunidades mejorada */}
      {filteredCommunities.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl shadow-lg border border-gray-700/50 p-12">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
              <UserGroupIcon className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-400 text-lg mb-1">No se encontraron comunidades</p>
            <p className="text-gray-500 text-sm">Intenta ajustar los filtros de búsqueda o crea una nueva comunidad</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCommunities.map((community) => (
            <div key={community.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl shadow-lg border border-gray-600/30 overflow-hidden hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200 group">
              {/* Community Image */}
              {community.image_url && (
                <div className="h-48 bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden rounded-t-xl">
                  <img
                    src={community.image_url}
                    alt={community.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
              
              {/* Header */}
              <div className="p-6 border-b border-gray-600/30">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${getCategoryColor(community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública')}`}>
                    {community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública'}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${
                    community.is_active 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {community.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                  {community.name}
                </h3>

                {community.course && (
                  <div className="mb-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">
                      <DocumentTextIcon className="h-3 w-3" />
                      {community.course.title}
                    </span>
                  </div>
                )}

                <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
                  {community.description}
                </p>
              </div>

              {/* Stats */}
              <div className="p-6 pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <div className="flex items-center justify-center mb-1 gap-1.5">
                      <UsersIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-400">Miembros</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {community.member_count}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <div className="flex items-center justify-center mb-1 gap-1.5">
                      <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-400">Posts</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {community.posts_count || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4 pb-4 border-b border-gray-600/30">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>{community.created_at ? new Date(community.created_at).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewCommunity(community)}
                      className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-500/30"
                      title="Ver detalles"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleToggleVisibility(community)}
                      className="p-2.5 text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-orange-500/30"
                      title={community.is_active ? 'Ocultar comunidad' : 'Mostrar comunidad'}
                    >
                      {community.is_active ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditCommunity(community)}
                      className="p-2.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/30"
                      title="Editar comunidad"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCommunity(community)}
                      className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30"
                      title="Eliminar comunidad"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modales */}
      <EditCommunityModal
        community={editingCommunity}
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSave={handleSaveCommunity}
      />

      <DeleteCommunityModal
        community={deletingCommunity}
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <AddCommunityModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSave={handleSaveNewCommunity}
      />
    </div>
  )
}

