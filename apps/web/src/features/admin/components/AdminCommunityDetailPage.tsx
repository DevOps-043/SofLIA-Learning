'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import {
  ArrowLeftIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CalendarIcon,
  MapPinIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  LockClosedIcon,
  FlagIcon
} from '@heroicons/react/24/outline'
import { useCommunityDetail } from '../hooks/useCommunityDetail'
import { CommunityReportsSection } from './CommunityReportsSection'

const ConfirmationModal = dynamic(() => import('./ConfirmationModal').then(mod => ({ default: mod.ConfirmationModal })), {
  ssr: false
})
const PostDetailModal = dynamic(() => import('./PostDetailModal').then(mod => ({ default: mod.PostDetailModal })), {
  ssr: false
})
const InviteUserModal = dynamic(() => import('./InviteUserModal').then(mod => ({ default: mod.InviteUserModal })), {
  ssr: false
})

interface AdminCommunityDetailPageProps {
  slug: string
}

export function AdminCommunityDetailPage({ slug }: AdminCommunityDetailPageProps) {
  const router = useRouter()
  const { community, posts, members, accessRequests, videos, isLoading, error, refetch, updateMembers, updateAccessRequests, updatePosts } = useCommunityDetail(slug)
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'requests' | 'videos' | 'reports'>('posts')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  
  // Estados para el modal de confirmación
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'warning' | 'success' | 'danger'
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    onConfirm: () => {}
  })

  // Función helper para mostrar el modal de confirmación
  const showConfirmation = (title: string, message: string, type: 'warning' | 'success' | 'danger', onConfirm: () => void) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    })
  }

  const closeConfirmation = () => {
    setConfirmationModal(prev => ({ ...prev, isOpen: false }))
  }

  // Estados para modales de posts
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false)
  const [isPostEditModalOpen, setIsPostEditModalOpen] = useState(false)
  
  // Estados para modal de invitar usuario
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false)

  // Función para invitar usuario
  const handleInviteUser = async (userId: string, role: string) => {
    if (!community) return

    try {
      const response = await fetch(`/api/admin/communities/${community.id}/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, role })
      })

      const data = await response.json()

      if (data.success) {
        // Recargar datos para mostrar el nuevo miembro
        await refetch()
      } else {
        throw new Error(data.error || 'Error al invitar usuario')
      }
    } catch (error) {
      throw error
    }
  }

  // Funciones para manejar acciones de miembros
  const handleToggleMemberRole = async (memberId: string, currentRole: string) => {
    if (!community) return
    
    setIsProcessing(memberId)
    try {
      const newRole = currentRole === 'admin' ? 'member' : 'admin'
      const response = await fetch(`/api/admin/communities/${community.id}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // Actualizar el estado local en lugar de recargar toda la página
        const updatedMembers = members.map(member => 
          member.id === memberId 
            ? { ...member, role: newRole }
            : member
        )
        // Actualizar solo los miembros sin recargar toda la página
        updateMembers(updatedMembers)
      } else {
      }
    } catch (error) {
    } finally {
      setIsProcessing(null)
    }
  }

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!community) return
    
    showConfirmation(
      'Remover Miembro',
      `¿Estás seguro de que quieres remover a ${memberName} de la comunidad? Esta acción no se puede deshacer.`,
      'danger',
      async () => {
        setIsProcessing(memberId)
        try {
          const response = await fetch(`/api/admin/communities/${community.id}/members/${memberId}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            // Actualizar el estado local removiendo el miembro
            const updatedMembers = members.filter(member => member.id !== memberId)
            updateMembers(updatedMembers)
          } else {
          }
        } catch (error) {
        } finally {
          setIsProcessing(null)
          closeConfirmation()
        }
      }
    )
  }

  // Funciones para manejar acciones de solicitudes de acceso
  const handleApproveRequest = (requestId: string, requesterName: string) => {
    if (!community) return
    
    showConfirmation(
      'Aprobar Solicitud',
      `¿Estás seguro de que quieres aprobar la solicitud de acceso de ${requesterName}? El usuario se convertirá en miembro de la comunidad.`,
      'success',
      async () => {
        setIsProcessing(requestId)
        try {
          const response = await fetch(`/api/admin/communities/${community.id}/access-requests/${requestId}/approve`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const result = await response.json()
            // Actualizar el estado local cambiando el status de la solicitud
            const updatedRequests = accessRequests.map(request => 
              request.id === requestId 
                ? { ...request, status: 'approved' }
                : request
            )
            // Actualizar solo las solicitudes sin recargar toda la página
            updateAccessRequests(updatedRequests)
          } else {
            const errorData = await response.json()
            alert(`Error: ${errorData.message || 'Error desconocido'}`)
          }
        } catch (error) {
        } finally {
          setIsProcessing(null)
          closeConfirmation()
        }
      }
    )
  }

  const handleRejectRequest = (requestId: string, requesterName: string) => {
    if (!community) return
    
    showConfirmation(
      'Rechazar Solicitud',
      `¿Estás seguro de que quieres rechazar la solicitud de acceso de ${requesterName}? Esta acción no se puede deshacer.`,
      'danger',
      async () => {
        setIsProcessing(requestId)
        try {
          const response = await fetch(`/api/admin/communities/${community.id}/access-requests/${requestId}/reject`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const result = await response.json()
            // Actualizar el estado local cambiando el status de la solicitud
            const updatedRequests = accessRequests.map(request => 
              request.id === requestId 
                ? { ...request, status: 'rejected' }
                : request
            )
            // Actualizar solo las solicitudes sin recargar toda la página
            updateAccessRequests(updatedRequests)
          } else {
            const errorData = await response.json()
            alert(`Error: ${errorData.message || 'Error desconocido'}`)
          }
        } catch (error) {
        } finally {
          setIsProcessing(null)
          closeConfirmation()
        }
      }
    )
  }

  // Funciones para manejar acciones de posts
  const handleViewPost = (post: any) => {
    setSelectedPost(post)
    setIsPostDetailModalOpen(true)
  }

  const handleEditPost = (post: any) => {
    setSelectedPost(post)
    setIsPostEditModalOpen(true)
  }

  const handleDeletePost = (post: any) => {
    const postTitle = post.content ? (post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content) : 'Post sin contenido'
    showConfirmation(
      'Eliminar Post',
      `¿Estás seguro de que quieres eliminar el post "${postTitle}"? Esta acción no se puede deshacer.`,
      'danger',
      async () => {
        setIsProcessing(post.id)
        try {
          const response = await fetch(`/api/admin/communities/${community?.id}/posts/${post.id}`, {
            method: 'DELETE',
          })

          if (response.ok) {
            // Actualizar el estado local removiendo el post
            const updatedPosts = posts.filter(p => p.id !== post.id)
            updatePosts(updatedPosts)
          } else {
            const errorData = await response.json()
            alert(`Error: ${errorData.message || 'Error desconocido'}`)
          }
        } catch (error) {
        } finally {
          setIsProcessing(null)
          closeConfirmation()
        }
      }
    )
  }

  const handleHidePost = (post: any) => {
    const postTitle = post.content ? (post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content) : 'Post sin contenido'
    showConfirmation(
      'Ocultar Post',
      `¿Estás seguro de que quieres ocultar el post "${postTitle}"? El post no será visible para los usuarios.`,
      'warning',
      async () => {
        setIsProcessing(post.id)
        try {
          const response = await fetch(`/api/admin/communities/${community?.id}/posts/${post.id}/toggle-visibility`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            // Actualizar el estado local cambiando la visibilidad del post
            const updatedPosts = posts.map(p => 
              p.id === post.id 
                ? { ...p, is_hidden: !p.is_hidden }
                : p
            )
            updatePosts(updatedPosts)
          } else {
            const errorData = await response.json()
            alert(`Error: ${errorData.message || 'Error desconocido'}`)
          }
        } catch (error) {
        } finally {
          setIsProcessing(null)
          closeConfirmation()
        }
      }
    )
  }

  const handleTogglePinPost = (post: any) => {
    const postTitle = post.content ? (post.content.length > 30 ? post.content.substring(0, 30) + '...' : post.content) : 'Post sin contenido'
    const action = post.is_pinned ? 'desfijar' : 'fijar'
    showConfirmation(
      `${post.is_pinned ? 'Desfijar' : 'Fijar'} Post`,
      `¿Estás seguro de que quieres ${action} el post "${postTitle}"? ${post.is_pinned ? 'El post ya no aparecerá fijado en la parte superior.' : 'El post aparecerá fijado en la parte superior.'}`,
      'warning',
      async () => {
        setIsProcessing(post.id)
        try {
          const response = await fetch(`/api/admin/communities/${community?.id}/posts/${post.id}/toggle-pin`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            // Actualizar el estado local cambiando el estado de fijado del post
            const updatedPosts = posts.map(p => 
              p.id === post.id 
                ? { ...p, is_pinned: !p.is_pinned }
                : p
            )
            updatePosts(updatedPosts)
          } else {
            const errorData = await response.json()
            alert(`Error: ${errorData.message || 'Error desconocido'}`)
          }
        } catch (error) {
        } finally {
          setIsProcessing(null)
          closeConfirmation()
        }
      }
    )
  }

  const closePostModals = () => {
    setIsPostDetailModalOpen(false)
    setIsPostEditModalOpen(false)
    setSelectedPost(null)
  }


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando información de la comunidad...</p>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error || 'Comunidad no encontrada'}</p>
            <button
              onClick={() => router.back()}
              className="bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pública': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-800'
      case 'Privada': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-800'
      case 'Moderada': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activa': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-800'
      case 'Inactiva': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-800'
      case 'moderator': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-800'
      case 'member': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
    }
  }

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-800'
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-800'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{community.name}</h1>
                <p className="text-gray-600 dark:text-gray-400">Administración de comunidad</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getCategoryColor(community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública')}`}>
                {community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública'}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(community.is_active ? 'Activa' : 'Inactiva')}`}>
                {community.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Community Info Card */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex items-start space-x-6">
            {community.image_url && (
              <div className="flex-shrink-0">
                <img
                  src={community.image_url}
                  alt={community.name}
                  className="h-24 w-24 rounded-lg object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{community.name}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{community.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{community.member_count} miembros</span>
                </div>
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{community.posts_count} posts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{community.comments_count} comentarios</span>
                </div>
                <div className="flex items-center space-x-2">
                  <VideoCameraIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{community.videos_count} videos</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Creada: {community.created_at ? new Date(community.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>Actualizada: {community.updated_at ? new Date(community.updated_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div className="text-gray-500 dark:text-gray-500">
                  por {community.creator_name || 'Creador desconocido'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'posts', label: 'Posts', icon: DocumentTextIcon, count: posts.length },
                { id: 'members', label: 'Miembros', icon: UserGroupIcon, count: members.length },
                { id: 'requests', label: 'Solicitudes', icon: UserPlusIcon, count: accessRequests.length },
                { id: 'videos', label: 'Videos', icon: VideoCameraIcon, count: videos.length },
                { id: 'reports', label: 'Reportes', icon: FlagIcon, count: 0 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Posts de la Comunidad</h3>
                {posts.length === 0 ? (
                  <div className="text-center py-8">
                    <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No hay posts en esta comunidad</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {post.is_pinned && (
                                <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-xs border border-yellow-800">
                                  Fijado
                                </span>
                              )}
                              {post.is_hidden && (
                                <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800">
                                  <EyeSlashIcon className="h-3 w-3 inline mr-1" />
                                  Oculto
                                </span>
                              )}
                              <h4 className="text-gray-900 dark:text-white font-medium">
                                {post.content ? (post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content) : 'Post sin contenido'}
                              </h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">{post.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                              <div className="flex items-center space-x-1">
                                <UserGroupIcon className="h-4 w-4" />
                                <span>{post.users?.display_name || `${post.users?.first_name} ${post.users?.last_name}`}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{new Date(post.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                <span>{post.likes_count || 0} likes</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <DocumentTextIcon className="h-4 w-4" />
                                <span>{post.comments_count || 0} comentarios</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button 
                              onClick={() => handleViewPost(post)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Ver detalles del post"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditPost(post)}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                              title="Editar post"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleTogglePinPost(post)}
                              disabled={isProcessing === post.id}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                post.is_pinned 
                                  ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20' 
                                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              }`}
                              title={post.is_pinned ? "Desfijar post" : "Fijar post"}
                            >
                              {isProcessing === post.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400"></div>
                              ) : (
                                <MapPinIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleHidePost(post)}
                              disabled={isProcessing === post.id}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                post.is_hidden 
                                  ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20' 
                                  : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                              }`}
                              title={post.is_hidden ? "Mostrar post" : "Ocultar post"}
                            >
                              {isProcessing === post.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 dark:border-yellow-400"></div>
                              ) : (
                                <EyeSlashIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleDeletePost(post)}
                              disabled={isProcessing === post.id}
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar post"
                            >
                              {isProcessing === post.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400"></div>
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Miembros de la Comunidad</h3>
                {members.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No hay miembros en esta comunidad</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-center space-x-3">
                           <div className="flex-shrink-0">
                             <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                               <UserGroupIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                             </div>
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-gray-900 dark:text-white font-medium truncate">
                               {member.name || 'Usuario no encontrado'}
                             </p>
                             <p className="text-gray-600 dark:text-gray-400 text-sm truncate">
                               {`ID: ${member.id}`}
                             </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleColor(member.role)}`}>
                                {member.role}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor('Activa')}`}>
                                Activo
                              </span>
                            </div>
                          </div>
                           <div className="flex space-x-1">
                             <button 
                               onClick={() => handleToggleMemberRole(member.id, member.role)}
                               disabled={isProcessing === member.id}
                               className="p-1 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               title={member.role === 'admin' ? 'Degradar a miembro' : 'Promover a admin'}
                             >
                               {isProcessing === member.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400"></div>
                               ) : (
                                 <CheckIcon className="h-4 w-4" />
                               )}
                             </button>
                             <button 
                               onClick={() => handleRemoveMember(member.id, member.name)}
                               disabled={isProcessing === member.id}
                               className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               title="Remover de la comunidad"
                             >
                               {isProcessing === member.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400"></div>
                               ) : (
                                 <XMarkIcon className="h-4 w-4" />
                               )}
                             </button>
                           </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                          Se unió: {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Solicitudes de Acceso</h3>
                  <button
                    onClick={() => setIsInviteUserModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Invitar Usuario
                  </button>
                </div>
                {accessRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <UserPlusIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No hay solicitudes pendientes</p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Usa el botón "Invitar Usuario" para agregar miembros directamente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accessRequests.map((request) => (
                      <div key={request.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {request.requester?.profile_picture_url ? (
                                <img
                                  src={request.requester.profile_picture_url}
                                  alt={request.requester.display_name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                                  <UserGroupIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-gray-900 dark:text-white font-medium">
                                {request.requester?.display_name || `${request.requester?.first_name} ${request.requester?.last_name}`}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{request.requester?.email}</p>
                              {request.note && (
                                <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{request.note}</p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRequestStatusColor(request.status)}`}>
                                  {request.status}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                           <div className="flex space-x-2">
                             <button 
                               onClick={() => handleApproveRequest(request.id, request.requester?.display_name || `${request.requester?.first_name} ${request.requester?.last_name}`)}
                               disabled={isProcessing === request.id || (request.status !== 'pending')}
                               className="p-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               title={request.status === 'pending' ? 'Aprobar solicitud' : 'Solicitud ya procesada'}
                             >
                               {isProcessing === request.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 dark:border-green-400"></div>
                               ) : (
                                 <CheckIcon className="h-4 w-4" />
                               )}
                             </button>
                             <button 
                               onClick={() => handleRejectRequest(request.id, request.requester?.display_name || `${request.requester?.first_name} ${request.requester?.last_name}`)}
                               disabled={isProcessing === request.id || (request.status !== 'pending')}
                               className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                               title={request.status === 'pending' ? 'Rechazar solicitud' : 'Solicitud ya procesada'}
                             >
                               {isProcessing === request.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400"></div>
                               ) : (
                                 <XMarkIcon className="h-4 w-4" />
                               )}
                             </button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'videos' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Videos de la Comunidad</h3>
                {videos.length === 0 ? (
                  <div className="text-center py-8">
                    <VideoCameraIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No hay videos en esta comunidad</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <div key={video.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {video.thumbnail_url && (
                          <div className="aspect-video bg-gray-200 dark:bg-gray-700">
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="text-gray-900 dark:text-white font-medium mb-2">{video.title}</h4>
                          {video.description && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{video.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                              <span>{video.video_provider}</span>
                              {video.duration && (
                                <span>• {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <button className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reports' && (
              <CommunityReportsSection communitySlug={slug} />
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        isLoading={isProcessing !== null}
      />

      {/* Modal de Detalles del Post */}
      <PostDetailModal
        isOpen={isPostDetailModalOpen}
        onClose={closePostModals}
        post={selectedPost}
      />

      {/* Modal de Invitar Usuario */}
      {community && (
        <InviteUserModal
          isOpen={isInviteUserModalOpen}
          onClose={() => setIsInviteUserModalOpen(false)}
          onInvite={handleInviteUser}
          communityId={community.id}
          communityName={community.name}
        />
      )}
    </div>
  )
}
