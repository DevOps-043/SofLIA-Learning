import {
  Calendar,
  Clock,
  FileText,
  MessageCircle,
  UserRound,
  Users,
  Video,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCommunity } from '../../services/adminCommunities.service'
import { formatCommunityDetailDate } from './shared'

interface AdminCommunityOverviewProps {
  community: AdminCommunity
}

export function AdminCommunityOverview({
  community,
}: AdminCommunityOverviewProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()
  const stats = [
    {
      icon: Users,
      label: t('communityCard.membersLabel'),
      value: community.member_count || 0,
      color: theme.primaryColor,
    },
    {
      icon: FileText,
      label: t('communityCard.postsLabel'),
      value: community.posts_count || 0,
      color: theme.successColor,
    },
    {
      icon: MessageCircle,
      label: t('communityDetail.overview.comments'),
      value: community.comments_count || 0,
      color: theme.warningColor,
    },
    {
      icon: Video,
      label: t('communityDetail.overview.videos'),
      value: community.videos_count || 0,
      color: theme.secondaryColor,
    },
  ]
  const createdAt = formatCommunityDetailDate(community.created_at)
  const updatedAt = formatCommunityDetailDate(community.updated_at)

  return (
    <div
      className="mb-6 rounded-2xl border p-5 shadow-sm sm:p-6"
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div
          className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border"
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
          }}
        >
          {community.image_url ? (
            <img
              alt={community.name}
              className="h-full w-full object-cover"
              src={community.image_url}
            />
          ) : (
            <Users className="h-10 w-10" style={{ color: theme.subtextColor }} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold" style={{ color: theme.textColor }}>
            {community.name}
          </h2>
          <p
            className="mt-2 max-w-4xl text-sm leading-relaxed"
            style={{ color: theme.subtextColor }}
          >
            {community.description}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                className="rounded-xl border p-3"
                key={stat.label}
                style={{
                  backgroundColor: theme.inputBg,
                  borderColor: theme.borderColor,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${stat.color}14` }}
                  >
                    <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold" style={{ color: theme.textColor }}>
                      {stat.value}
                    </p>
                    <p className="text-xs" style={{ color: theme.subtextColor }}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            className="mt-5 flex flex-col gap-3 border-t pt-4 text-sm lg:flex-row lg:items-center lg:justify-between"
            style={{ borderColor: theme.dividerColor, color: theme.subtextColor }}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {t('communityDetail.overview.createdAt', {
                    date: createdAt || t('communityCard.noDate'),
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {t('communityDetail.overview.updatedAt', {
                    date: updatedAt || t('communityCard.noDate'),
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4" />
              <span>
                {t('communityDetail.overview.creator', {
                  name: community.creator_name || t('communityCard.noCreator'),
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
