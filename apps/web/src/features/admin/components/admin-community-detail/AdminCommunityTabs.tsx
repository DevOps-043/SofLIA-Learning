import {
  DocumentTextIcon,
  FlagIcon,
  UserGroupIcon,
  UserPlusIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'
import type { AdminCommunityDetailTabId } from '../../types/admin-community-detail.types'

interface AdminCommunityTabsProps {
  activeTab: AdminCommunityDetailTabId
  setActiveTab: (tab: AdminCommunityDetailTabId) => void
  counts: {
    posts: number
    members: number
    requests: number
    videos: number
  }
}

const tabs: Array<{
  id: AdminCommunityDetailTabId
  label: string
  icon: typeof DocumentTextIcon
  countKey?: keyof AdminCommunityTabsProps['counts']
}> = [
  { id: 'posts', label: 'Posts', icon: DocumentTextIcon, countKey: 'posts' },
  { id: 'members', label: 'Miembros', icon: UserGroupIcon, countKey: 'members' },
  { id: 'requests', label: 'Solicitudes', icon: UserPlusIcon, countKey: 'requests' },
  { id: 'videos', label: 'Videos', icon: VideoCameraIcon, countKey: 'videos' },
  { id: 'reports', label: 'Reportes', icon: FlagIcon }
]

export function AdminCommunityTabs({
  activeTab,
  setActiveTab,
  counts
}: AdminCommunityTabsProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="flex flex-wrap gap-x-6 px-6">
        {tabs.map(tab => {
          const count = tab.countKey ? counts[tab.countKey] : 0

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                {count}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
