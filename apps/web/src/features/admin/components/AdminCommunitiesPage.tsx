'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Crown, MessageCircle, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../hooks/useAdminPanelTheme'
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
} from './admin-communities'

export function AdminCommunitiesPage() {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const logic = useAdminCommunitiesPageLogic()

  if (logic.isLoading) {
    return <AdminCommunitiesLoadingState />
  }

  if (logic.error) {
    return (
      <AdminCommunitiesErrorState
        error={logic.error}
        onRetry={logic.refetch}
      />
    )
  }

  const stats = [
    {
      title: t('communities.stats.total'),
      value: logic.stats?.totalCommunities || 0,
      icon: <Users className="h-full w-full" />,
      iconColor: theme.primaryColor,
    },
    {
      title: t('communities.stats.members'),
      value: logic.stats?.totalMembers || 0,
      icon: <Crown className="h-full w-full" />,
      iconColor: theme.warningColor,
    },
    {
      title: t('communities.stats.posts'),
      value: logic.stats?.totalPosts || 0,
      icon: <MessageCircle className="h-full w-full" />,
      iconColor: theme.successColor,
    },
    {
      title: t('communities.stats.active'),
      value: logic.stats?.activeCommunities || 0,
      icon: <Activity className="h-full w-full" />,
      iconColor: theme.secondaryColor,
    },
  ]

  return (
    <>
      <div
        className="min-h-screen p-6 transition-colors duration-300 lg:p-8"
        style={{ backgroundColor: theme.panelBg }}
      >
        <div className="mx-auto max-w-7xl">
          <AdminCommunitiesHeader
            onCreate={() => logic.setIsAddModalOpen(true)}
          />

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item, index) => (
              <AdminCommunitiesStatCard
                key={item.title}
                title={item.title}
                value={item.value}
                icon={item.icon}
                iconColor={item.iconColor}
                delay={index}
              />
            ))}
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

          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm" style={{ color: theme.subtextColor }}>
              {t('communities.showing', {
                filtered: logic.filteredCommunities.length,
                total: logic.communities.length,
              })}
            </p>
          </div>

          {logic.filteredCommunities.length === 0 ? (
            <AdminCommunitiesEmptyState
              onCreate={() => logic.setIsAddModalOpen(true)}
            />
          ) : (
            <motion.div
              layout
              className={
                logic.viewMode === 'grid'
                  ? 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3'
                  : 'flex flex-col gap-4'
              }
            >
              <AnimatePresence mode="popLayout">
                {logic.filteredCommunities.map((community, index) => (
                  <AdminCommunityCard
                    key={community.id}
                    community={community}
                    index={index}
                    viewMode={logic.viewMode}
                    onView={() => logic.handleViewCommunity(community)}
                    onEdit={() => logic.handleEditCommunity(community)}
                    onDelete={() => logic.handleDeleteCommunity(community)}
                    onToggleVisibility={() =>
                      void logic.handleToggleVisibility(community)
                    }
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
