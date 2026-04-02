'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCommunityDetail } from './useCommunityDetail'
import {
  AdminCommunityDetailService,
  removeAdminCommunityMember,
  removeAdminCommunityPost,
  replaceAdminCommunityMemberRole,
  toggleAdminCommunityPostBoolean,
  updateAdminCommunityRequestStatus
} from '../services/adminCommunityDetail.service'
import type { AdminCommunityPost, AdminCommunityDetailTabId } from '../types/admin-community-detail.types'

interface ConfirmationModalState {
  isOpen: boolean
  title: string
  message: string
  type: 'warning' | 'success' | 'danger'
  onConfirm: () => void
}

const initialConfirmationModal: ConfirmationModalState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'warning',
  onConfirm: () => {}
}

export function useAdminCommunityDetailPageLogic(slug: string) {
  const router = useRouter()
  const {
    community,
    posts,
    members,
    accessRequests,
    videos,
    isLoading,
    error,
    refetch,
    updateMembers,
    updateAccessRequests,
    updatePosts
  } = useCommunityDetail(slug)

  const [activeTab, setActiveTab] = useState<AdminCommunityDetailTabId>('posts')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>(initialConfirmationModal)
  const [selectedPost, setSelectedPost] = useState<AdminCommunityPost | null>(null)
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false)
  const [isInviteUserModalOpen, setIsInviteUserModalOpen] = useState(false)

  const showConfirmation = (
    title: string,
    message: string,
    type: ConfirmationModalState['type'],
    onConfirm: () => void
  ) => {
    setConfirmationModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm
    })
  }

  const closeConfirmation = () => {
    setConfirmationModal(previous => ({ ...previous, isOpen: false }))
  }

  const handleInviteUser = async (userId: string, role: string) => {
    if (!community) {
      return
    }

    await AdminCommunityDetailService.inviteUser(community.id, userId, role)
    await refetch()
  }

  const handleToggleMemberRole = async (memberId: string, currentRole: string) => {
    if (!community) {
      return
    }

    const nextRole = currentRole === 'admin' ? 'member' : 'admin'
    setIsProcessing(memberId)

    try {
      await AdminCommunityDetailService.updateMemberRole(community.id, memberId, nextRole)
      updateMembers(replaceAdminCommunityMemberRole(members, memberId, nextRole))
    } finally {
      setIsProcessing(null)
    }
  }

  const handleRemoveMember = (memberId: string, memberName: string) => {
    if (!community) {
      return
    }

    showConfirmation(
      'Remover Miembro',
      `Estas seguro de que quieres remover a ${memberName} de la comunidad? Esta accion no se puede deshacer.`,
      'danger',
      () => {
        void (async () => {
          setIsProcessing(memberId)
          try {
            await AdminCommunityDetailService.removeMember(community.id, memberId)
            updateMembers(removeAdminCommunityMember(members, memberId))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const handleApproveRequest = (requestId: string, requesterName: string) => {
    if (!community) {
      return
    }

    showConfirmation(
      'Aprobar Solicitud',
      `Estas seguro de que quieres aprobar la solicitud de acceso de ${requesterName}? El usuario se convertira en miembro de la comunidad.`,
      'success',
      () => {
        void (async () => {
          setIsProcessing(requestId)
          try {
            await AdminCommunityDetailService.updateAccessRequest(community.id, requestId, 'approve')
            updateAccessRequests(updateAdminCommunityRequestStatus(accessRequests, requestId, 'approved'))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const handleRejectRequest = (requestId: string, requesterName: string) => {
    if (!community) {
      return
    }

    showConfirmation(
      'Rechazar Solicitud',
      `Estas seguro de que quieres rechazar la solicitud de acceso de ${requesterName}? Esta accion no se puede deshacer.`,
      'danger',
      () => {
        void (async () => {
          setIsProcessing(requestId)
          try {
            await AdminCommunityDetailService.updateAccessRequest(community.id, requestId, 'reject')
            updateAccessRequests(updateAdminCommunityRequestStatus(accessRequests, requestId, 'rejected'))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const handleViewPost = (post: AdminCommunityPost) => {
    setSelectedPost(post)
    setIsPostDetailModalOpen(true)
  }

  const handleDeletePost = (post: AdminCommunityPost) => {
    if (!community) {
      return
    }

    const postTitle = post.content ? (post.content.length > 30 ? `${post.content.substring(0, 30)}...` : post.content) : 'Post sin contenido'

    showConfirmation(
      'Eliminar Post',
      `Estas seguro de que quieres eliminar el post "${postTitle}"? Esta accion no se puede deshacer.`,
      'danger',
      () => {
        void (async () => {
          setIsProcessing(post.id)
          try {
            await AdminCommunityDetailService.deletePost(community.id, post.id)
            updatePosts(removeAdminCommunityPost(posts, post.id))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const handleHidePost = (post: AdminCommunityPost) => {
    if (!community) {
      return
    }

    const postTitle = post.content ? (post.content.length > 30 ? `${post.content.substring(0, 30)}...` : post.content) : 'Post sin contenido'

    showConfirmation(
      'Ocultar Post',
      `Estas seguro de que quieres ocultar el post "${postTitle}"? El post no sera visible para los usuarios.`,
      'warning',
      () => {
        void (async () => {
          setIsProcessing(post.id)
          try {
            await AdminCommunityDetailService.togglePostVisibility(community.id, post.id)
            updatePosts(toggleAdminCommunityPostBoolean(posts, post.id, 'is_hidden'))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const handleTogglePinPost = (post: AdminCommunityPost) => {
    if (!community) {
      return
    }

    const postTitle = post.content ? (post.content.length > 30 ? `${post.content.substring(0, 30)}...` : post.content) : 'Post sin contenido'
    const action = post.is_pinned ? 'desfijar' : 'fijar'

    showConfirmation(
      `${post.is_pinned ? 'Desfijar' : 'Fijar'} Post`,
      `Estas seguro de que quieres ${action} el post "${postTitle}"? ${post.is_pinned ? 'El post ya no aparecera fijado en la parte superior.' : 'El post aparecera fijado en la parte superior.'}`,
      'warning',
      () => {
        void (async () => {
          setIsProcessing(post.id)
          try {
            await AdminCommunityDetailService.togglePostPin(community.id, post.id)
            updatePosts(toggleAdminCommunityPostBoolean(posts, post.id, 'is_pinned'))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const closePostModals = () => {
    setIsPostDetailModalOpen(false)
    setSelectedPost(null)
  }

  return {
    community,
    posts,
    members,
    accessRequests,
    videos,
    isLoading,
    error,
    router,
    activeTab,
    setActiveTab,
    isProcessing,
    confirmationModal,
    closeConfirmation,
    selectedPost,
    isPostDetailModalOpen,
    isInviteUserModalOpen,
    setIsInviteUserModalOpen,
    handleInviteUser,
    handleToggleMemberRole,
    handleRemoveMember,
    handleApproveRequest,
    handleRejectRequest,
    handleViewPost,
    handleDeletePost,
    handleHidePost,
    handleTogglePinPost,
    closePostModals
  }
}
