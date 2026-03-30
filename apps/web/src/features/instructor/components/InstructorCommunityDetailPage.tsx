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
  LockClosedIcon
} from '@heroicons/react/24/outline'
import { useInstructorCommunityDetail } from '../hooks/useInstructorCommunityDetail'

const ConfirmationModal = dynamic(() => import('../../admin/components/ConfirmationModal').then(mod => ({ default: mod.ConfirmationModal })), {
  ssr: false
})
const PostDetailModal = dynamic(() => import('../../admin/components/PostDetailModal').then(mod => ({ default: mod.PostDetailModal })), {
  ssr: false
})
const InviteUserModal = dynamic(() => import('../../admin/components/InviteUserModal').then(mod => ({ default: mod.InviteUserModal })), {
  ssr: false
})

interface InstructorCommunityDetailPageProps {
  slug: string
}

export function InstructorCommunityDetailPage({ slug }: InstructorCommunityDetailPageProps) {
  const router = useRouter()
  const { community, posts, members, accessRequests, videos, isLoading, error, refetch, updateMembers, updateAccessRequests, updatePosts } = useInstructorCommunityDetail(slug)
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'requests' | 'videos'>('posts')
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando información de la comunidad...</p>
        </div>
      </div>
    )
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl shadow-lg border border-red-500/30 p-8">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-red-300 mb-4">{error || 'Comunidad no encontrada o no tienes permisos para acceder a ella'}</p>
            <button
              onClick={() => router.push('/instructor/communities')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Volver a Comunidades
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Pública': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Privada': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Moderada': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Activa': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Inactiva': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'moderator': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'member': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header mejorado */}
      <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-b border-gray-700/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/instructor/communities')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{community.name}</h1>
                <p className="text-gray-400 text-sm">Gestión de tu comunidad</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${getCategoryColor(community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública')}`}>
                {community.visibility === 'private' ? (
                  <LockClosedIcon className="h-4 w-4" />
                ) : (
                  <GlobeAltIcon className="h-4 w-4" />
                )}
                {community.visibility === 'private' ? 'Privada' : community.access_type === 'moderated' ? 'Moderada' : 'Pública'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor(community.is_active ? 'Activa' : 'Inactiva')}`}>
                <ShieldCheckIcon className="h-4 w-4" />
                {community.is_active ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Community Info Card mejorada */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl shadow-lg border border-gray-700/50 p-6 mb-8 backdrop-blur-sm">
          <div className="flex items-start space-x-6">
            {community.image_url && (
              <div className="flex-shrink-0">
                <img
                  src={community.image_url}
                  alt={community.name}
                  className="h-24 w-24 rounded-xl object-cover border border-gray-700/50 shadow-lg"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">{community.name}</h2>
              <p className="text-gray-300 mb-4 leading-relaxed">{community.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <UserGroupIcon className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-gray-400">Miembros</p>
                    <p className="text-sm font-bold text-white">{community.member_count}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <DocumentTextIcon className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Posts</p>
                    <p className="text-sm font-bold text-white">{community.posts_count}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-400">Comentarios</p>
                    <p className="text-sm font-bold text-white">{community.comments_count}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <VideoCameraIcon className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-xs text-gray-400">Videos</p>
                    <p className="text-sm font-bold text-white">{community.videos_count}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700/50">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Creada: {community.created_at ? new Date(community.created_at).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs mejorados */}
        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl shadow-lg border border-gray-700/50 mb-6 backdrop-blur-sm overflow-hidden">
          <div className="border-b border-gray-700/50">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'posts', label: 'Posts', icon: DocumentTextIcon, count: posts.length },
                { id: 'members', label: 'Miembros', icon: UserGroupIcon, count: members.length },
                { id: 'requests', label: 'Solicitudes', icon: UserPlusIcon, count: accessRequests.length },
                { id: 'videos', label: 'Videos', icon: VideoCameraIcon, count: videos.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full text-xs border border-gray-600/50">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content mejorado */}
          <div className="p-6">
            {activeTab === 'posts' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Posts de la Comunidad</h3>
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-lg mb-1">No hay posts en esta comunidad</p>
                    <p className="text-gray-500 text-sm">Los posts aparecerán aquí cuando se creen</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl border border-gray-600/30 p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              {post.is_pinned && (
                                <span className="bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full text-xs font-medium border border-yellow-500/30">
                                  📌 Fijado
                                </span>
                              )}
                              {post.is_hidden && (
                                <span className="bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full text-xs font-medium border border-red-500/30">
                                  <EyeSlashIcon className="h-3 w-3 inline mr-1" />
                                  Oculto
                                </span>
                              )}
                              <h4 className="text-white font-medium">
                                {post.content ? (post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content) : 'Post sin contenido'}
                              </h4>
                            </div>
                            <p className="text-gray-300 text-sm mb-3 line-clamp-3 leading-relaxed">{post.content}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-400">
                              <div className="flex items-center space-x-1.5">
                                <UserGroupIcon className="h-4 w-4" />
                                <span>{post.users?.display_name || `${post.users?.first_name} ${post.users?.last_name}`}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <CalendarIcon className="h-4 w-4" />
                                <span>{new Date(post.created_at).toLocaleDateString('es-ES')}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                <span>{post.likes_count || 0} likes</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <DocumentTextIcon className="h-4 w-4" />
                                <span>{post.comments_count || 0} comentarios</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button 
                              onClick={() => handleViewPost(post)}
                              className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-500/30"
                              title="Ver detalles del post"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleEditPost(post)}
                              className="p-2.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/30"
                              title="Editar post"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleTogglePinPost(post)}
                              disabled={isProcessing === post.id}
                              className={`p-2.5 rounded-lg transition-all duration-200 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                                post.is_pinned 
                                  ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/30' 
                                  : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30'
                              }`}
                              title={post.is_pinned ? "Desfijar post" : "Fijar post"}
                            >
                              {isProcessing === post.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                              ) : (
                                <MapPinIcon className="h-5 w-5" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleHidePost(post)}
                              disabled={isProcessing === post.id}
                              className={`p-2.5 rounded-lg transition-all duration-200 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                                post.is_hidden 
                                  ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/30' 
                                  : 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/30'
                              }`}
                              title={post.is_hidden ? "Mostrar post" : "Ocultar post"}
                            >
                              {isProcessing === post.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-400"></div>
                              ) : (
                                <EyeSlashIcon className="h-5 w-5" />
                              )}
                            </button>
                            <button 
                              onClick={() => handleDeletePost(post)}
                              disabled={isProcessing === post.id}
                              className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Eliminar post"
                            >
                              {isProcessing === post.id ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                              ) : (
                                <TrashIcon className="h-5 w-5" />
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
                <h3 className="text-lg font-semibold text-white mb-4">Miembros de la Comunidad</h3>
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
                      <UserGroupIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-lg mb-1">No hay miembros en esta comunidad</p>
                    <p className="text-gray-500 text-sm">Los miembros aparecerán aquí cuando se unan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl border border-gray-600/30 p-4 hover:border-blue-500/50 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                           <div className="flex-shrink-0">
                             <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border border-gray-500/30">
                               <UserGroupIcon className="h-6 w-6 text-gray-300" />
                             </div>
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-white font-medium truncate">
                               {member.name || 'Usuario no encontrado'}
                             </p>
                             <p className="text-gray-400 text-xs truncate">
                               {member.users?.email || 'Sin email'}
                             </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getRoleColor(member.role)}`}>
                                {member.role}
                              </span>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor('Activa')}`}>
                                Activo
                              </span>
                            </div>
                          </div>
                           <div className="flex space-x-1">
                             <button 
                               onClick={() => handleToggleMemberRole(member.id, member.role)}
                               disabled={isProcessing === member.id}
                               className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                               title={member.role === 'admin' ? 'Degradar a miembro' : 'Promover a admin'}
                             >
                               {isProcessing === member.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400"></div>
                               ) : (
                                 <CheckIcon className="h-5 w-5" />
                               )}
                             </button>
                             <button 
                               onClick={() => handleRemoveMember(member.id, member.name)}
                               disabled={isProcessing === member.id}
                               className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                               title="Remover de la comunidad"
                             >
                               {isProcessing === member.id ? (
                                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                               ) : (
                                 <XMarkIcon className="h-5 w-5" />
                               )}
                             </button>
                           </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-500 pt-3 border-t border-gray-600/30">
                          Se unió: {member.joined_at ? new Date(member.joined_at).toLocaleDateString('es-ES') : 'N/A'}
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
                  <h3 className="text-lg font-semibold text-white">Solicitudes de Acceso</h3>
                  <button
                    onClick={() => setIsInviteUserModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30"
                  >
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Invitar Usuario
                  </button>
                </div>
                {accessRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
                      <UserPlusIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-lg mb-1">No hay solicitudes pendientes</p>
                    <p className="text-gray-500 text-sm">Usa el botón "Invitar Usuario" para agregar miembros directamente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {accessRequests.map((request) => (
                      <div key={request.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl border border-gray-600/30 p-4 hover:border-blue-500/50 transition-all duration-200">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {request.requester?.profile_picture_url ? (
                                <img
                                  src={request.requester.profile_picture_url}
                                  alt={request.requester.display_name}
                                  className="h-10 w-10 rounded-full object-cover border border-gray-600/30"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center border border-gray-500/30">
                                  <UserGroupIcon className="h-6 w-6 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-medium">
                                {request.requester?.display_name || `${request.requester?.first_name} ${request.requester?.last_name}`}
                              </p>
                              <p className="text-gray-400 text-sm">{request.requester?.email}</p>
                              {request.note && (
                                <p className="text-gray-300 text-sm mt-2 bg-gray-700/30 p-2 rounded-lg">{request.note}</p>
                              )}
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${getRequestStatusColor(request.status)}`}>
                                  {request.status}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(request.created_at).toLocaleDateString('es-ES')}
                                </span>
                              </div>
                            </div>
                          </div>
                           <div className="flex space-x-2">
                             <button 
                               onClick={() => handleApproveRequest(request.id, request.requester?.display_name || `${request.requester?.first_name} ${request.requester?.last_name}`)}
                               disabled={isProcessing === request.id || (request.status !== 'pending')}
                               className="p-2.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                               title={request.status === 'pending' ? 'Aprobar solicitud' : 'Solicitud ya procesada'}
                             >
                               {isProcessing === request.id ? (
                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400"></div>
                               ) : (
                                 <CheckIcon className="h-5 w-5" />
                               )}
                             </button>
                             <button 
                               onClick={() => handleRejectRequest(request.id, request.requester?.display_name || `${request.requester?.first_name} ${request.requester?.last_name}`)}
                               disabled={isProcessing === request.id || (request.status !== 'pending')}
                               className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                               title={request.status === 'pending' ? 'Rechazar solicitud' : 'Solicitud ya procesada'}
                             >
                               {isProcessing === request.id ? (
                                 <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                               ) : (
                                 <XMarkIcon className="h-5 w-5" />
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
                <h3 className="text-lg font-semibold text-white mb-4">Videos de la Comunidad</h3>
                {videos.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
                      <VideoCameraIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-lg mb-1">No hay videos en esta comunidad</p>
                    <p className="text-gray-500 text-sm">Los videos aparecerán aquí cuando se agreguen</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <div key={video.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl border border-gray-600/30 overflow-hidden hover:border-blue-500/50 transition-all duration-200">
                        {video.thumbnail_url && (
                          <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden">
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <h4 className="text-white font-medium mb-2 line-clamp-2">{video.title}</h4>
                          {video.description && (
                            <p className="text-gray-300 text-sm mb-3 line-clamp-2 leading-relaxed">{video.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-xs text-gray-400">
                              <span>{video.video_provider}</span>
                              {video.duration && (
                                <span>• {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}</span>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <button className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-500/30">
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/30">
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30">
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

