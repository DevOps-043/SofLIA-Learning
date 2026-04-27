'use client'

import { Activity, Crown, MessageCircle, Plus, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminCommunitiesPageLogic } from '../hooks/useAdminCommunitiesPageLogic'
import { AddCommunityModal } from './AddCommunityModal'
import { DeleteCommunityModal } from './DeleteCommunityModal'
import { EditCommunityModal } from './EditCommunityModal'
import {
  AdminButton,
  AdminMetricCard,
  AdminPageShell,
  AdminSectionHeader,
} from './ui'
import { useAdminTheme } from '../hooks/useAdminTheme'
import {
  AdminCommunitiesEmptyState,
  AdminCommunitiesErrorState,
  AdminCommunitiesFilters,
  AdminCommunitiesLoadingState,
  AdminCommunityCard,
} from './admin-communities'

export function AdminCommunitiesPage() {
  const { t } = useTranslation('admin')
  const theme = useAdminTheme()
  const logic = useAdminCommunitiesPageLogic()

  if (logic.isLoading) {
    return <AdminCommunitiesLoadingState />
  }

  if (logic.error) {
    return <AdminCommunitiesErrorState error={logic.error} onRetry={logic.refetch} />
  }

  return (
    <>
      <AdminPageShell maxWidth="content">
        <div className="space-y-7">
          <AdminSectionHeader
            size="page"
            icon={Users}
            kicker={t('communities.page.kicker')}
            title={t('communities.page.title')}
            description={t('communities.page.description')}
            actions={(
              <AdminButton icon={Plus} onClick={() => logic.setIsAddModalOpen(true)}>
                {t('communities.page.create')}
              </AdminButton>
            )}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminMetricCard
              label={t('communities.stats.total')}
              value={logic.stats?.totalCommunities || 0}
              icon={Users}
              tone="primary"
            />
            <AdminMetricCard
              label={t('communities.stats.members')}
              value={logic.stats?.totalMembers || 0}
              icon={Crown}
              tone="warning"
            />
            <AdminMetricCard
              label={t('communities.stats.posts')}
              value={logic.stats?.totalPosts || 0}
              icon={MessageCircle}
              tone="primary"
            />
            <AdminMetricCard
              label={t('communities.stats.active')}
              value={logic.stats?.activeCommunities || 0}
              icon={Activity}
              tone="info"
            />
          </div>

          <AdminCommunitiesFilters
            searchTerm={logic.searchTerm}
            onSearchChange={logic.setSearchTerm}
            filterCategory={logic.filterCategory}
            onCategoryChange={logic.setFilterCategory}
            filterStatus={logic.filterStatus}
            onStatusChange={logic.setFilterStatus}
            viewMode={logic.viewMode}
            onViewModeChange={logic.setViewMode}
          />

          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: theme.textMuted }}>
              {t('communities.showing', { filtered: logic.filteredCommunities.length, total: logic.communities.length })}
            </p>
          </div>

          {logic.filteredCommunities.length === 0 ? (
            <AdminCommunitiesEmptyState onCreate={() => logic.setIsAddModalOpen(true)} />
          ) : (
            <motion.div
              layout
              className={logic.viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}
            >
              <AnimatePresence mode="popLayout">
                {logic.filteredCommunities.map((community, index) => (
                  <AdminCommunityCard
                    key={community.id}
                    community={community}
                    index={index}
                    onView={() => logic.handleViewCommunity(community)}
                    onEdit={() => logic.handleEditCommunity(community)}
                    onDelete={() => logic.handleDeleteCommunity(community)}
                    onToggleVisibility={() => void logic.handleToggleVisibility(community)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </AdminPageShell>

      <EditCommunityModal
        community={logic.editingCommunity}
        isOpen={logic.isEditModalOpen}
        onClose={logic.closeEditModal}
        onSave={logic.handleSaveCommunity}
      />

      <DeleteCommunityModal
        community={logic.deletingCommunity}
        isOpen={logic.isDeleteModalOpen}
        onClose={logic.closeDeleteModal}
        onConfirm={logic.handleConfirmDelete}
      />

      <AddCommunityModal
        isOpen={logic.isAddModalOpen}
        onClose={() => logic.setIsAddModalOpen(false)}
        onSave={logic.handleSaveNewCommunity}
      />
    </>
  )
}
