'use client'

import { AlertCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
import { useAdminCommunityDetailPageLogic } from '../hooks/useAdminCommunityDetailPageLogic'
import { AdminCommunityDetailHeader } from './admin-community-detail/AdminCommunityDetailHeader'
import { AdminCommunityMembersTab } from './admin-community-detail/AdminCommunityMembersTab'
import { AdminCommunityOverview } from './admin-community-detail/AdminCommunityOverview'
import { AdminCommunityPostsTab } from './admin-community-detail/AdminCommunityPostsTab'
import { AdminCommunityRequestsTab } from './admin-community-detail/AdminCommunityRequestsTab'
import { AdminCommunityTabs } from './admin-community-detail/AdminCommunityTabs'
import { AdminCommunityVideosTab } from './admin-community-detail/AdminCommunityVideosTab'
import { CommunityReportsSection } from './CommunityReportsSection'
import { ConfirmationModal } from './ConfirmationModal'
import { InviteUserModal } from './InviteUserModal'
import { PostDetailModal } from './PostDetailModal'

interface AdminCommunityDetailPageProps {
  slug: string
}

export function AdminCommunityDetailPage({
  slug,
}: AdminCommunityDetailPageProps) {
  const logic = useAdminCommunityDetailPageLogic(slug)
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const theme = useAdminPanelTheme()

  if (logic.isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: theme.panelBg }}
      >
        <div className="text-center">
          <Loader2
            className="mx-auto mb-4 h-12 w-12 animate-spin"
            style={{ color: theme.primaryColor }}
          />
          <p className="text-sm font-medium" style={{ color: theme.subtextColor }}>
            {t('communityDetail.page.loading')}
          </p>
        </div>
      </div>
    )
  }

  if (logic.error || !logic.community) {
    return (
      <div
        className="flex min-h-screen items-center justify-center p-4"
        style={{ backgroundColor: theme.panelBg }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-6 text-center shadow-xl"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${theme.dangerColor}14` }}
          >
            <AlertCircle className="h-6 w-6" style={{ color: theme.dangerColor }} />
          </div>
          <h2 className="text-xl font-bold" style={{ color: theme.textColor }}>
            {t('communityDetail.page.errorTitle')}
          </h2>
          <p className="mt-2 text-sm" style={{ color: theme.subtextColor }}>
            {logic.error || t('communityDetail.page.notFound')}
          </p>
          <button
            className="mt-5 rounded-xl px-5 py-2.5 text-sm font-semibold"
            onClick={() => logic.router.back()}
            style={{
              backgroundColor: theme.primaryColor,
              color: theme.onPrimaryColor,
            }}
            type="button"
          >
            {tc('actions.back')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.panelBg }}>
      <AdminCommunityDetailHeader
        community={logic.community}
        onBack={() => logic.router.back()}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AdminCommunityOverview community={logic.community} />

        <div
          className="mb-6 overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
        >
          <AdminCommunityTabs
            activeTab={logic.activeTab}
            counts={{
              members: logic.members.length,
              posts: logic.posts.length,
              requests: logic.accessRequests.length,
              videos: logic.videos.length,
            }}
            setActiveTab={logic.setActiveTab}
          />

          <div className="p-5 sm:p-6">
            {logic.activeTab === 'posts' ? (
              <AdminCommunityPostsTab
                isProcessing={logic.isProcessing}
                onDeletePost={logic.handleDeletePost}
                onHidePost={logic.handleHidePost}
                onTogglePinPost={logic.handleTogglePinPost}
                onViewPost={logic.handleViewPost}
                posts={logic.posts}
              />
            ) : null}

            {logic.activeTab === 'members' ? (
              <AdminCommunityMembersTab
                isProcessing={logic.isProcessing}
                members={logic.members}
                onRemoveMember={logic.handleRemoveMember}
                onToggleMemberRole={logic.handleToggleMemberRole}
              />
            ) : null}

            {logic.activeTab === 'requests' ? (
              <AdminCommunityRequestsTab
                accessRequests={logic.accessRequests}
                isProcessing={logic.isProcessing}
                onApproveRequest={logic.handleApproveRequest}
                onOpenInviteModal={() => logic.setIsInviteUserModalOpen(true)}
                onRejectRequest={logic.handleRejectRequest}
              />
            ) : null}

            {logic.activeTab === 'videos' ? (
              <AdminCommunityVideosTab videos={logic.videos} />
            ) : null}

            {logic.activeTab === 'reports' ? (
              <CommunityReportsSection communitySlug={slug} />
            ) : null}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isLoading={logic.isProcessing !== null}
        isOpen={logic.confirmationModal.isOpen}
        message={logic.confirmationModal.message}
        onClose={logic.closeConfirmation}
        onConfirm={logic.confirmationModal.onConfirm}
        title={logic.confirmationModal.title}
        type={logic.confirmationModal.type}
      />

      <PostDetailModal
        isOpen={logic.isPostDetailModalOpen}
        onClose={logic.closePostModals}
        post={logic.selectedPost}
      />

      <InviteUserModal
        communityId={logic.community.id}
        communityName={logic.community.name}
        isOpen={logic.isInviteUserModalOpen}
        onClose={() => logic.setIsInviteUserModalOpen(false)}
        onInvite={logic.handleInviteUser}
      />
    </div>
  )
}
