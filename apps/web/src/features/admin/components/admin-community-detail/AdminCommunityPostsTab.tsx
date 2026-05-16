import {
  Calendar,
  Eye,
  EyeOff,
  FileText,
  MessageCircle,
  Pin,
  Trash2,
  UserRound,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAdminPanelTheme } from '../../hooks/useAdminPanelTheme'
import type { AdminCommunityPost } from '../../types/admin-community-detail.types'
import { formatCommunityDetailDate } from './shared'

interface AdminCommunityPostsTabProps {
  isProcessing: string | null
  onDeletePost: (post: AdminCommunityPost) => void
  onHidePost: (post: AdminCommunityPost) => void
  onTogglePinPost: (post: AdminCommunityPost) => void
  onViewPost: (post: AdminCommunityPost) => void
  posts: AdminCommunityPost[]
}

function getAuthorName(post: AdminCommunityPost, fallback: string) {
  return (
    post.users?.display_name ||
    `${post.users?.first_name || ''} ${post.users?.last_name || ''}`.trim() ||
    post.users?.email ||
    fallback
  )
}

export function AdminCommunityPostsTab({
  isProcessing,
  onDeletePost,
  onHidePost,
  onTogglePinPost,
  onViewPost,
  posts,
}: AdminCommunityPostsTabProps) {
  const { t } = useTranslation('admin')
  const theme = useAdminPanelTheme()

  function getPostTitle(content: string) {
    if (!content) {
      return t('communityDetail.posts.noContent')
    }

    return content.length > 60 ? `${content.substring(0, 60)}...` : content
  }

  const iconButtonStyle = {
    backgroundColor: theme.cardBg,
    borderColor: theme.borderColor,
    color: theme.subtextColor,
  }

  if (posts.length === 0) {
    return (
      <div className="py-10 text-center">
        <FileText
          className="mx-auto mb-4 h-12 w-12"
          style={{ color: theme.subtextColor }}
        />
        <p className="text-sm" style={{ color: theme.subtextColor }}>
          {t('communityDetail.posts.empty')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div
          className="rounded-2xl border p-4"
          key={post.id}
          style={{
            backgroundColor: theme.inputBg,
            borderColor: theme.borderColor,
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {post.is_pinned ? (
                  <span
                    className="rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${theme.warningColor}14`,
                      borderColor: `${theme.warningColor}26`,
                      color: theme.warningColor,
                    }}
                  >
                    {t('communityDetail.posts.pinned')}
                  </span>
                ) : null}
                {post.is_hidden ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: `${theme.dangerColor}14`,
                      borderColor: `${theme.dangerColor}26`,
                      color: theme.dangerColor,
                    }}
                  >
                    <EyeOff className="h-3 w-3" />
                    {t('communityDetail.posts.hidden')}
                  </span>
                ) : null}
                <h3 className="font-semibold" style={{ color: theme.textColor }}>
                  {getPostTitle(post.content)}
                </h3>
              </div>

              <p
                className="mb-3 line-clamp-3 text-sm"
                style={{ color: theme.subtextColor }}
              >
                {post.content}
              </p>

              <div
                className="flex flex-wrap items-center gap-4 text-sm"
                style={{ color: theme.subtextColor }}
              >
                <div className="flex items-center gap-1">
                  <UserRound className="h-4 w-4" />
                  <span>
                    {getAuthorName(
                      post,
                      t('communityDetail.posts.unknownUser'),
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatCommunityDetailDate(post.created_at) ||
                      t('communityCard.noDate')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>
                    {post.likes_count || 0}{' '}
                    {t('communityDetail.posts.likesLabel')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>
                    {post.comments_count || 0}{' '}
                    {t('communityDetail.posts.commentsLabel')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border p-2 transition-colors"
                onClick={() => onViewPost(post)}
                style={iconButtonStyle}
                title={t('communityDetail.posts.viewDetails')}
                type="button"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                className="rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isProcessing === post.id}
                onClick={() => onTogglePinPost(post)}
                style={{
                  ...iconButtonStyle,
                  color: post.is_pinned
                    ? theme.primaryColor
                    : theme.subtextColor,
                }}
                title={
                  post.is_pinned
                    ? t('communityDetail.posts.unpinPost')
                    : t('communityDetail.posts.pinPost')
                }
                type="button"
              >
                {isProcessing === post.id ? (
                  <span
                    className="block h-4 w-4 animate-spin rounded-full border-2"
                    style={{
                      borderColor: `${theme.primaryColor}33`,
                      borderTopColor: theme.primaryColor,
                    }}
                  />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </button>
              <button
                className="rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isProcessing === post.id}
                onClick={() => onHidePost(post)}
                style={{
                  ...iconButtonStyle,
                  color: post.is_hidden
                    ? theme.warningColor
                    : theme.subtextColor,
                }}
                title={
                  post.is_hidden
                    ? t('communityDetail.posts.showPost')
                    : t('communityDetail.posts.hidePost')
                }
                type="button"
              >
                {isProcessing === post.id ? (
                  <span
                    className="block h-4 w-4 animate-spin rounded-full border-2"
                    style={{
                      borderColor: `${theme.warningColor}33`,
                      borderTopColor: theme.warningColor,
                    }}
                  />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>
              <button
                className="rounded-xl border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isProcessing === post.id}
                onClick={() => onDeletePost(post)}
                style={{
                  ...iconButtonStyle,
                  color: theme.dangerColor,
                }}
                title={t('communityDetail.posts.deletePost')}
                type="button"
              >
                {isProcessing === post.id ? (
                  <span
                    className="block h-4 w-4 animate-spin rounded-full border-2"
                    style={{
                      borderColor: `${theme.dangerColor}33`,
                      borderTopColor: theme.dangerColor,
                    }}
                  />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
