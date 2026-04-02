import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'
import type { AdminCommunity } from '../../services/adminCommunities.service'

interface AdminCommunityOverviewProps {
  community: AdminCommunity
}

function formatCommunityDate(value?: string | null) {
  if (!value) {
    return 'N/A'
  }

  return new Date(value).toLocaleDateString()
}

export function AdminCommunityOverview({ community }: AdminCommunityOverviewProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-8">
      <div className="flex items-start gap-6">
        {community.image_url ? (
          <div className="flex-shrink-0">
            <img
              src={community.image_url}
              alt={community.name}
              className="h-24 w-24 rounded-lg object-cover"
            />
          </div>
        ) : null}

        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{community.name}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{community.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <UserGroupIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{community.member_count} miembros</span>
            </div>
            <div className="flex items-center space-x-2">
              <DocumentTextIcon className="h-5 w-5 text-green-500 dark:text-green-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{community.posts_count} posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{community.comments_count} comentarios</span>
            </div>
            <div className="flex items-center space-x-2">
              <VideoCameraIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{community.videos_count} videos</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between text-sm text-gray-600 dark:text-gray-400">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center space-x-1">
                <CalendarIcon className="h-4 w-4" />
                <span>Creada: {formatCommunityDate(community.created_at)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>Actualizada: {formatCommunityDate(community.updated_at)}</span>
              </div>
            </div>
            <div className="text-gray-500 dark:text-gray-500">
              por {community.creator_name || 'Creador desconocido'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
