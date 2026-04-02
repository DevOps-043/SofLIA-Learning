'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInstructorCommunityDetail } from './useInstructorCommunityDetail'
import {
  InstructorCommunityDetailService,
  removeCommunityMember,
  removeCommunityPost,
  replaceCommunityMemberRole,
  toggleCommunityPostBoolean,
  updateCommunityRequestStatus
} from '../services/instructorCommunityDetail.service'
import type { CommunityPost } from '../types/instructor-community-detail.types'
import type { CommunityDetailTabId } from '../components/community-detail/shared'

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

export function useInstructorCommunityDetailPageLogic(slug: string) {
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
  } = useInstructorCommunityDetail(slug)

  const [activeTab, setActiveTab] = useState<CommunityDetailTabId>('posts')
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModalState>(initialConfirmationModal)
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null)
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
    setConfirmationModal(prev => ({ ...prev, isOpen: false }))
  }

  const handleInviteUser = async (userId: string, role: string) => {
    if (!community) {
      return
    }

    await InstructorCommunityDetailService.inviteUser(community.id, userId, role)
    await refetch()
  }

  const handleToggleMemberRole = async (memberId: string, currentRole: string) => {
    if (!community) {
      return
    }

    const newRole = currentRole === 'admin' ? 'member' : 'admin'
    setIsProcessing(memberId)

    try {
      await InstructorCommunityDetailService.updateMemberRole(community.id, memberId, newRole)
      updateMembers(replaceCommunityMemberRole(members, memberId, newRole))
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
      `¿Estás seguro de que quieres remover a ${memberName} de la comunidad? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        void (async () => {
          setIsProcessing(memberId)
          try {
            await InstructorCommunityDetailService.removeMember(community.id, memberId)
            updateMembers(removeCommunityMember(members, memberId))
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
      `¿Estás seguro de que quieres aprobar la solicitud de acceso de ${requesterName}? El usuario se convertirá en miembro de la comunidad.`,
      'success',
      () => {
        void (async () => {
          setIsProcessing(requestId)
          try {
            await InstructorCommunityDetailService.updateAccessRequest(community.id, requestId, 'approve')
            updateAccessRequests(updateCommunityRequestStatus(accessRequests, requestId, 'approved'))
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
      `¿Estás seguro de que quieres rechazar la solicitud de acceso de ${requesterName}? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        void (async () => {
          setIsProcessing(requestId)
          try {
            await InstructorCommunityDetailService.updateAccessRequest(community.id, requestId, 'reject')
            updateAccessRequests(updateCommunityRequestStatus(accessRequests, requestId, 'rejected'))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const handleViewPost = (post: CommunityPost) => {
    setSelectedPost(post)
    setIsPostDetailModalOpen(true)
  }

  const handleDeletePost = (post: CommunityPost) => {
    if (!community) {
      return
    }

    const postTitle = post.content ? (post.content.length > 30 ? `${post.content.substring(0, 30)}...` : post.content) : 'Post sin contenido'

    showConfirmation(
      'Eliminar Post',
      `¿Estás seguro de que quieres eliminar el post "${postTitle}"? Esta acción no se puede deshacer.`,
      'danger',
      () => {
        void (async () => {
          setIsProcessing(post.id)
          try {
            await InstructorCommunityDetailService.deletePost(community.id, post.id)
            updatePosts(removeCommunityPost(posts, post.id))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const handleHidePost = (post: CommunityPost) => {
    if (!community) {
      return
    }

    const postTitle = post.content ? (post.content.length > 30 ? `${post.content.substring(0, 30)}...` : post.content) : 'Post sin contenido'

    showConfirmation(
      'Ocultar Post',
      `¿Estás seguro de que quieres ocultar el post "${postTitle}"? El post no será visible para los usuarios.`,
      'warning',
      () => {
        void (async () => {
          setIsProcessing(post.id)
          try {
            await InstructorCommunityDetailService.togglePostVisibility(community.id, post.id)
            updatePosts(toggleCommunityPostBoolean(posts, post.id, 'is_hidden'))
          } finally {
            setIsProcessing(null)
            closeConfirmation()
          }
        })()
      }
    )
  }

  const handleTogglePinPost = (post: CommunityPost) => {
    if (!community) {
      return
    }

    const postTitle = post.content ? (post.content.length > 30 ? `${post.content.substring(0, 30)}...` : post.content) : 'Post sin contenido'
    const action = post.is_pinned ? 'desfijar' : 'fijar'

    showConfirmation(
      `${post.is_pinned ? 'Desfijar' : 'Fijar'} Post`,
      `¿Estás seguro de que quieres ${action} el post "${postTitle}"? ${post.is_pinned ? 'El post ya no aparecerá fijado en la parte superior.' : 'El post aparecerá fijado en la parte superior.'}`,
      'warning',
      () => {
        void (async () => {
          setIsProcessing(post.id)
          try {
            await InstructorCommunityDetailService.togglePostPin(community.id, post.id)
            updatePosts(toggleCommunityPostBoolean(posts, post.id, 'is_pinned'))
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
