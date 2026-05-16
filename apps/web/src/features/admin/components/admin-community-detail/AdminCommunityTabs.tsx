import { FileText, Flag, UserPlus, Users, Video, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCommunityDetailTabId } from '../../types/admin-community-detail.types'

interface AdminCommunityTabsProps {
  activeTab: AdminCommunityDetailTabId
  counts: {
    members: number
    posts: number
    requests: number
    videos: number
  }
  setActiveTab: (tab: AdminCommunityDetailTabId) => void
}

const tabs: Array<{
  countKey?: keyof AdminCommunityTabsProps['counts']
  icon: LucideIcon
  id: AdminCommunityDetailTabId
  labelKey: string
}> = [
  {
    countKey: 'posts',
    icon: FileText,
    id: 'posts',
    labelKey: 'communityDetail.tabs.posts',
  },
  {
    countKey: 'members',
    icon: Users,
    id: 'members',
    labelKey: 'communityDetail.tabs.members',
  },
  {
    countKey: 'requests',
    icon: UserPlus,
    id: 'requests',
    labelKey: 'communityDetail.tabs.requests',
  },
  {
    countKey: 'videos',
    icon: Video,
    id: 'videos',
    labelKey: 'communityDetail.tabs.videos',
  },
  {
    icon: Flag,
    id: 'reports',
    labelKey: 'communityDetail.tabs.reports',
  },
]

export function AdminCommunityTabs({
  activeTab,
  counts,
  setActiveTab,
}: AdminCommunityTabsProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  return (
    <div className="border-b" style={{ borderColor: theme.borderColor }}>
      <nav className="flex flex-wrap gap-2 px-4 py-3 sm:px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const count = tab.countKey ? counts[tab.countKey] : 0
          const isActive = activeTab === tab.id

          return (
            <button
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors"
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                backgroundColor: isActive ? theme.actionSurface : 'transparent',
                color: isActive ? theme.primaryColor : theme.subtextColor,
              }}
              type="button"
            >
              <Icon className="h-4 w-4" />
              <span>{t(tab.labelKey)}</span>
              <span
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: isActive ? theme.cardBg : theme.inputBg,
                  color: isActive ? theme.primaryColor : theme.subtextColor,
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
