'use client'

import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import type { CommunityPost } from '../../types/instructor-community-detail.types'
import { getPostPreview } from './shared'

interface InstructorCommunityPostsTabProps {
  posts: CommunityPost[]
  isProcessing: string | null
  onViewPost: (post: CommunityPost) => void
  onDeletePost: (post: CommunityPost) => void
  onHidePost: (post: CommunityPost) => void
  onTogglePinPost: (post: CommunityPost) => void
}

export function InstructorCommunityPostsTab({
  posts,
  isProcessing,
  onViewPost,
  onDeletePost,
  onHidePost,
  onTogglePinPost
}: InstructorCommunityPostsTabProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">Posts de la Comunidad</h3>
      {posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex p-4 rounded-full bg-gray-700/50 mb-4">
            <DocumentTextIcon className="h-12 w-12 text-gray-400" />
          </div>
          <p className="text-gray-400 text-lg mb-1">No hay posts en esta comunidad</p>
          <p className="text-gray-500 text-sm">Los posts aparecerán aquí cuando se creen</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-gradient-to-br from-gray-700/50 to-gray-800/30 rounded-xl border border-gray-600/30 p-4 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {post.is_pinned ? (
                      <span className="bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full text-xs font-medium border border-yellow-500/30">
                        📌 Fijado
                      </span>
                    ) : null}
                    {post.is_hidden ? (
                      <span className="bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full text-xs font-medium border border-red-500/30">
                        <EyeSlashIcon className="h-3 w-3 inline mr-1" />
                        Oculto
                      </span>
                    ) : null}
                    <h4 className="text-white font-medium">{getPostPreview(post.content)}</h4>
                  </div>
                  <p className="text-gray-300 text-sm mb-3 line-clamp-3 leading-relaxed">{post.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center space-x-1.5">
                      <UserGroupIcon className="h-4 w-4" />
                      <span>{post.users?.display_name || `${post.users?.first_name} ${post.users?.last_name}`}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>{new Date(post.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <ChatBubbleLeftRightIcon className="h-4 w-4" />
                      <span>{post.likes_count || 0} likes</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>{post.comments_count || 0} comentarios</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onViewPost(post)}
                    className="p-2.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-blue-500/30"
                    title="Ver detalles del post"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    className="p-2.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-yellow-500/30"
                    title="Editar post"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onTogglePinPost(post)}
                    disabled={isProcessing === post.id}
                    className={`p-2.5 rounded-lg transition-all duration-200 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      post.is_pinned
                        ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/30'
                        : 'text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30'
                    }`}
                    title={post.is_pinned ? 'Desfijar post' : 'Fijar post'}
                  >
                    {isProcessing === post.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                    ) : (
                      <MapPinIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => onHidePost(post)}
                    disabled={isProcessing === post.id}
                    className={`p-2.5 rounded-lg transition-all duration-200 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
                      post.is_hidden
                        ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 hover:border-orange-500/30'
                        : 'text-gray-400 hover:text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/30'
                    }`}
                    title={post.is_hidden ? 'Mostrar post' : 'Ocultar post'}
                  >
                    {isProcessing === post.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-400"></div>
                    ) : (
                      <EyeSlashIcon className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeletePost(post)}
                    disabled={isProcessing === post.id}
                    className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 border border-transparent hover:border-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar post"
                  >
                    {isProcessing === post.id ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400"></div>
                    ) : (
                      <TrashIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
