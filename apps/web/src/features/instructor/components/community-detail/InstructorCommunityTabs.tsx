'use client'

import {
  DocumentTextIcon,
  UserGroupIcon,
  UserPlusIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'
import type { CommunityDetailTabId } from './shared'

interface InstructorCommunityTabsProps {
  activeTab: CommunityDetailTabId
  setActiveTab: (tab: CommunityDetailTabId) => void
  counts: {
    posts: number
    members: number
    requests: number
    videos: number
  }
}

export function InstructorCommunityTabs({ activeTab, setActiveTab, counts }: InstructorCommunityTabsProps) {
  return (
    <div className="border-b border-gray-700/50">
      <nav className="flex space-x-8 px-6">
        {[
          { id: 'posts' as const, label: 'Posts', icon: DocumentTextIcon, count: counts.posts },
          { id: 'members' as const, label: 'Miembros', icon: UserGroupIcon, count: counts.members },
          { id: 'requests' as const, label: 'Solicitudes', icon: UserPlusIcon, count: counts.requests },
          { id: 'videos' as const, label: 'Videos', icon: VideoCameraIcon, count: counts.videos }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            <tab.icon className="h-5 w-5" />
            <span>{tab.label}</span>
            <span className="bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full text-xs border border-gray-600/50">{tab.count}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
