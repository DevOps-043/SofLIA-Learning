import { useTranslation } from 'react-i18next'
import {
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  TrashIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import type { AdminCommunityPost } from '../../types/admin-community-detail.types'

interface AdminCommunityPostsTabProps {
  posts: AdminCommunityPost[]
  isProcessing: string | null
  onViewPost: (post: AdminCommunityPost) => void
  onDeletePost: (post: AdminCommunityPost) => void
  onHidePost: (post: AdminCommunityPost) => void
  onTogglePinPost: (post: AdminCommunityPost) => void
}

function getAuthorName(post: AdminCommunityPost) {
  return (
    post.users?.display_name ||
    `${post.users?.first_name || ''} ${post.users?.last_name || ''}`.trim() ||
    post.users?.email ||
    'Usuario desconocido'
  )
}

export function AdminCommunityPostsTab({
  posts,
  isProcessing,
  onViewPost,
  onDeletePost,
  onHidePost,
  onTogglePinPost
}: AdminCommunityPostsTabProps) {
  const { t } = useTranslation('admin')

  function getPostTitle(content: string) {
    if (!content) {
      return t('communityDetail.posts.noContent')
    }
    return content.length > 60 ? `${content.substring(0, 60)}...` : content
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{t('communityDetail.posts.empty')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <div key={post.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center flex-wrap gap-2 mb-2">
                {post.is_pinned ? (
                  <span className="bg-yellow-900/30 text-yellow-400 px-2 py-1 rounded text-xs border border-yellow-800">
                    {t('communityDetail.posts.pinned')}
                  </span>
                ) : null}
                {post.is_hidden ? (
                  <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800 inline-flex items-center gap-1">
                    <EyeSlashIcon className="h-3 w-3" />
                    {t('communityDetail.posts.hidden')}
                  </span>
                ) : null}
                <h3 className="text-gray-900 dark:text-white font-medium">{getPostTitle(post.content)}</h3>
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">{post.content}</p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                <div className="flex items-center space-x-1">
                  <UserGroupIcon className="h-4 w-4" />
                  <span>{getAuthorName(post)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>{new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  <span>{post.likes_count || 0} {t('communityDetail.posts.likesLabel')}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>{post.comments_count || 0} {t('communityDetail.posts.commentsLabel')}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onViewPost(post)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title={t('communityDetail.posts.viewDetails')}
              >
                <EyeIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => onTogglePinPost(post)}
                disabled={isProcessing === post.id}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  post.is_pinned
                    ? 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
                title={post.is_pinned ? t('communityDetail.posts.unpinPost') : t('communityDetail.posts.pinPost')}
              >
                {isProcessing === post.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 dark:border-blue-400" />
                ) : (
                  <MapPinIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => onHidePost(post)}
                disabled={isProcessing === post.id}
                className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  post.is_hidden
                    ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                    : 'text-gray-600 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                }`}
                title={post.is_hidden ? t('communityDetail.posts.showPost') : t('communityDetail.posts.hidePost')}
              >
                {isProcessing === post.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 dark:border-yellow-400" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => onDeletePost(post)}
                disabled={isProcessing === post.id}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('communityDetail.posts.deletePost')}
              >
                {isProcessing === post.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 dark:border-red-400" />
                ) : (
                  <TrashIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
