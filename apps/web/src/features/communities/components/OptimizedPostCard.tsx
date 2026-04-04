'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import { useLazyImage } from '../../../core/hooks/useIntersectionObserver'
import { User, Heart, MessageSquare, Share2 } from 'lucide-react'
import { sanitizePost } from '../../../lib/sanitize/html-sanitizer'
import { PostMenu } from './PostMenu'

interface OptimizedPostCardProps {
  post: Record<string, unknown>
  communitySlug?: string
  onReact?: () => void
  onComment?: () => void
  onShare?: () => void
  onPostUpdate?: () => void
}

// Memoized para evitar re-renders innecesarios
export const OptimizedPostCard = memo(function OptimizedPostCard({
  post,
  communitySlug,
  onReact,
  onComment,
  onShare,
  onPostUpdate
}: OptimizedPostCardProps) {
  const [imageRef, imageSrc, imageLoaded] = useLazyImage(post.image_url || '')

  const getUserName = () => {
    if (post.user?.first_name && post.user?.last_name) {
      return `${post.user.first_name} ${post.user.last_name}`
    }
    return post.user?.username || 'Usuario'
  }

  const getTimeAgo = (date: string) => {
    const now = new Date()
    const postDate = new Date(date)
    const diff = now.getTime() - postDate.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Ahora'
    if (minutes < 60) return `Hace ${minutes}m`
    if (minutes < 1440) return `Hace ${Math.floor(minutes / 60)}h`
    return `Hace ${Math.floor(minutes / 1440)}d`
  }

  return (
    <article className="bg-slate-800 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {post.user?.profile_picture_url ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden">
              <Image
                src={post.user.profile_picture_url}
                alt={getUserName()}
                fill
                sizes="40px"
                className="object-cover"
                priority={false}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <p className="font-medium text-white">{getUserName()}</p>
            <p className="text-xs text-slate-400">{getTimeAgo(post.created_at)}</p>
          </div>
        </div>
        {communitySlug && (
          <PostMenu
            post={post}
            communitySlug={communitySlug}
            onShare={onShare}
            onPostUpdate={onPostUpdate}
          />
        )}
      </div>

      {/* Content */}
      <p 
        className="text-slate-200 mb-4 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: sanitizePost(post.content) }}
      />

      {/* Image with lazy loading */}
      {post.image_url && (
        <div className="mb-4 rounded-lg overflow-hidden bg-slate-700 relative w-full" style={{ minHeight: '256px' }}>
          <Image
            src={post.image_url}
            alt="Post image"
            width={600}
            height={400}
            className="w-full h-auto"
            loading="lazy"
            quality={85}
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-slate-700">
        <button
          onClick={onReact}
          className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors"
        >
          <Heart className="w-5 h-5" />
          <span className="text-sm">{post.reactions_count || 0}</span>
        </button>
        <button
          onClick={onComment}
          className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-sm">{post.comments_count || 0}</span>
        </button>
        <button
          onClick={onShare}
          className="flex items-center gap-2 text-slate-400 hover:text-green-400 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm">Compartir</span>
        </button>
      </div>
    </article>
  )
})
