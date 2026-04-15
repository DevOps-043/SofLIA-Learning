'use client'

import { Activity, Crown, MessageCircle, Users } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useAdminCommunitiesPageLogic } from '../hooks/useAdminCommunitiesPageLogic'
import { AddCommunityModal } from './AddCommunityModal'
import { DeleteCommunityModal } from './DeleteCommunityModal'
import { EditCommunityModal } from './EditCommunityModal'
import {
  AdminCommunitiesEmptyState,
  AdminCommunitiesErrorState,
  AdminCommunitiesFilters,
  AdminCommunitiesHeader,
  AdminCommunitiesLoadingState,
  AdminCommunitiesStatCard,
  AdminCommunityCard,
  adminCommunitiesColors,
} from './admin-communities'

export function AdminCommunitiesPage() {
  const { t } = useTranslation('admin')
  const logic = useAdminCommunitiesPageLogic()

  if (logic.isLoading) {
    return <AdminCommunitiesLoadingState />
  }

  if (logic.error) {
    return <AdminCommunitiesErrorState error={logic.error} onRetry={logic.refetch} />
  }

  return (
    <>
      <div className="min-h-screen p-6 lg:p-8" style={{ background: adminCommunitiesColors.bgPrimary }}>
        <div className="max-w-7xl mx-auto space-y-8">
          <AdminCommunitiesHeader onCreate={() => logic.setIsAddModalOpen(true)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminCommunitiesStatCard
              title={t('communities.stats.total')}
              value={logic.stats?.totalCommunities || 0}
              Icon={Users}
              iconColor={adminCommunitiesColors.accent}
              gradientClassName="bg-gradient-to-br from-[#00D4B3]/20 to-transparent"
              delay={0}
              trend={12}
            />
            <AdminCommunitiesStatCard
              title={t('communities.stats.members')}
              value={logic.stats?.totalMembers || 0}
              Icon={Crown}
              iconColor={adminCommunitiesColors.warning}
              gradientClassName="bg-gradient-to-br from-[#F59E0B]/20 to-transparent"
              delay={1}
              trend={8}
            />
            <AdminCommunitiesStatCard
              title={t('communities.stats.posts')}
              value={logic.stats?.totalPosts || 0}
              Icon={MessageCircle}
              iconColor={adminCommunitiesColors.success}
              gradientClassName="bg-gradient-to-br from-[#10B981]/20 to-transparent"
              delay={2}
              trend={24}
            />
            <AdminCommunitiesStatCard
              title={t('communities.stats.active')}
              value={logic.stats?.activeCommunities || 0}
              Icon={Activity}
              iconColor="#8B5CF6"
              gradientClassName="bg-gradient-to-br from-[#8B5CF6]/20 to-transparent"
              delay={3}
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
            <p className="text-sm text-gray-500">
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
      </div>

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
