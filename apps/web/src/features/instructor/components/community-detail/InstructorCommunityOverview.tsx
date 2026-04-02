'use client'

import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  UserGroupIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline'
import type { InstructorCommunity } from '../../services/instructorCommunities.service'

interface InstructorCommunityOverviewProps {
  community: InstructorCommunity
}

export function InstructorCommunityOverview({ community }: InstructorCommunityOverviewProps) {
  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/30 rounded-xl shadow-lg border border-gray-700/50 p-6 mb-8 backdrop-blur-sm">
      <div className="flex items-start space-x-6">
        {community.image_url ? (
          <div className="flex-shrink-0">
            <img src={community.image_url} alt={community.name} className="h-24 w-24 rounded-xl object-cover border border-gray-700/50 shadow-lg" />
          </div>
        ) : null}

        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-2">{community.name}</h2>
          <p className="text-gray-300 mb-4 leading-relaxed">{community.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <UserGroupIcon className="h-5 w-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Miembros</p>
                <p className="text-sm font-bold text-white">{community.member_count}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <DocumentTextIcon className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Posts</p>
                <p className="text-sm font-bold text-white">{community.posts_count}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Comentarios</p>
                <p className="text-sm font-bold text-white">{community.comments_count}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <VideoCameraIcon className="h-5 w-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">Videos</p>
                <p className="text-sm font-bold text-white">{community.videos_count}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700/50">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <CalendarIcon className="h-4 w-4" />
                <span>
                  Creada:{' '}
                  {community.created_at
                    ? new Date(community.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
