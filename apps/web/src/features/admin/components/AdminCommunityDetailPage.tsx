'use client'

import { ConfirmationModal } from './ConfirmationModal'
import { CommunityReportsSection } from './CommunityReportsSection'
import { InviteUserModal } from './InviteUserModal'
import { PostDetailModal } from './PostDetailModal'
import { useAdminCommunityDetailPageLogic } from '../hooks/useAdminCommunityDetailPageLogic'
import { AdminCommunityDetailHeader } from './admin-community-detail/AdminCommunityDetailHeader'
import { AdminCommunityMembersTab } from './admin-community-detail/AdminCommunityMembersTab'
import { AdminCommunityOverview } from './admin-community-detail/AdminCommunityOverview'
import { AdminCommunityPostsTab } from './admin-community-detail/AdminCommunityPostsTab'
import { AdminCommunityRequestsTab } from './admin-community-detail/AdminCommunityRequestsTab'
import { AdminCommunityTabs } from './admin-community-detail/AdminCommunityTabs'
import { AdminCommunityVideosTab } from './admin-community-detail/AdminCommunityVideosTab'

interface AdminCommunityDetailPageProps {
  slug: string
}

export function AdminCommunityDetailPage({ slug }: AdminCommunityDetailPageProps) {
  const logic = useAdminCommunityDetailPageLogic(slug)

  if (logic.isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando informacion de la comunidad...</p>
        </div>
      </div>
    )
  }

  if (logic.error || !logic.community) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Error</h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{logic.error || 'Comunidad no encontrada'}</p>
            <button
              onClick={() => logic.router.back()}
              className="bg-gray-700 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800">
      <AdminCommunityDetailHeader community={logic.community} onBack={() => logic.router.back()} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminCommunityOverview community={logic.community} />

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
          <AdminCommunityTabs
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
              <AdminCommunityPostsTab
                posts={logic.posts}
                isProcessing={logic.isProcessing}
                onViewPost={logic.handleViewPost}
                onDeletePost={logic.handleDeletePost}
                onHidePost={logic.handleHidePost}
                onTogglePinPost={logic.handleTogglePinPost}
              />
            ) : null}

            {logic.activeTab === 'members' ? (
              <AdminCommunityMembersTab
                members={logic.members}
                isProcessing={logic.isProcessing}
                onToggleMemberRole={logic.handleToggleMemberRole}
                onRemoveMember={logic.handleRemoveMember}
              />
            ) : null}

            {logic.activeTab === 'requests' ? (
              <AdminCommunityRequestsTab
                accessRequests={logic.accessRequests}
                isProcessing={logic.isProcessing}
                onOpenInviteModal={() => logic.setIsInviteUserModalOpen(true)}
                onApproveRequest={logic.handleApproveRequest}
                onRejectRequest={logic.handleRejectRequest}
              />
            ) : null}

            {logic.activeTab === 'videos' ? <AdminCommunityVideosTab videos={logic.videos} /> : null}

            {logic.activeTab === 'reports' ? <CommunityReportsSection communitySlug={slug} /> : null}
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
