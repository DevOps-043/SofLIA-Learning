'use client'

import { ConfirmationModal } from '../../admin/components/ConfirmationModal'
import { InviteUserModal } from '../../admin/components/InviteUserModal'
import { PostDetailModal } from '../../admin/components/PostDetailModal'
import { useInstructorCommunityDetailPageLogic } from '../hooks/useInstructorCommunityDetailPageLogic'
import { InstructorCommunityDetailHeader } from './community-detail/InstructorCommunityDetailHeader'
import { InstructorCommunityMembersTab } from './community-detail/InstructorCommunityMembersTab'
import { InstructorCommunityOverview } from './community-detail/InstructorCommunityOverview'
import { InstructorCommunityPostsTab } from './community-detail/InstructorCommunityPostsTab'
import { InstructorCommunityRequestsTab } from './community-detail/InstructorCommunityRequestsTab'
import { InstructorCommunityTabs } from './community-detail/InstructorCommunityTabs'
import { InstructorCommunityVideosTab } from './community-detail/InstructorCommunityVideosTab'

interface InstructorCommunityDetailPageProps {
  slug: string
}

export function InstructorCommunityDetailPage({ slug }: InstructorCommunityDetailPageProps) {
  const logic = useInstructorCommunityDetailPageLogic(slug)

  if (logic.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando información de la comunidad...</p>
        </div>
      </div>
    )
  }

  if (logic.error || !logic.community) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/10 rounded-xl shadow-lg border border-red-500/30 p-8">
            <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
            <p className="text-red-300 mb-4">{logic.error || 'Comunidad no encontrada o no tienes permisos para acceder a ella'}</p>
            <button
              onClick={() => logic.router.push('/instructor/communities')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-xl transition-colors"
            >
              Volver a Comunidades
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <InstructorCommunityDetailHeader community={logic.community} onBack={() => logic.router.push('/instructor/communities')} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <InstructorCommunityOverview community={logic.community} />

        <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl shadow-lg border border-gray-700/50 mb-6 backdrop-blur-sm overflow-hidden">
          <InstructorCommunityTabs
            activeTab={logic.activeTab}
            setActiveTab={logic.setActiveTab}
            counts={{
              posts: logic.posts.length,
              members: logic.members.length,
              requests: logic.accessRequests.length,
              videos: logic.videos.length
            }}
          />

          <div className="p-6">
            {logic.activeTab === 'posts' ? (
              <InstructorCommunityPostsTab
                posts={logic.posts}
                isProcessing={logic.isProcessing}
                onViewPost={logic.handleViewPost}
                onDeletePost={logic.handleDeletePost}
                onHidePost={logic.handleHidePost}
                onTogglePinPost={logic.handleTogglePinPost}
              />
            ) : null}

            {logic.activeTab === 'members' ? (
              <InstructorCommunityMembersTab
                members={logic.members}
                isProcessing={logic.isProcessing}
                onToggleMemberRole={logic.handleToggleMemberRole}
                onRemoveMember={logic.handleRemoveMember}
              />
            ) : null}

            {logic.activeTab === 'requests' ? (
              <InstructorCommunityRequestsTab
                accessRequests={logic.accessRequests}
                isProcessing={logic.isProcessing}
                onOpenInviteModal={() => logic.setIsInviteUserModalOpen(true)}
                onApproveRequest={logic.handleApproveRequest}
                onRejectRequest={logic.handleRejectRequest}
              />
            ) : null}

            {logic.activeTab === 'videos' ? <InstructorCommunityVideosTab videos={logic.videos} /> : null}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={logic.confirmationModal.isOpen}
        onClose={logic.closeConfirmation}
        onConfirm={logic.confirmationModal.onConfirm}
        title={logic.confirmationModal.title}
        message={logic.confirmationModal.message}
        type={logic.confirmationModal.type}
        isLoading={logic.isProcessing !== null}
      />

      <PostDetailModal isOpen={logic.isPostDetailModalOpen} onClose={logic.closePostModals} post={logic.selectedPost} />

      <InviteUserModal
        isOpen={logic.isInviteUserModalOpen}
        onClose={() => logic.setIsInviteUserModalOpen(false)}
        onInvite={logic.handleInviteUser}
        communityId={logic.community.id}
        communityName={logic.community.name}
      />
    </div>
  )
}
