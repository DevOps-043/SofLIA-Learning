import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'

export class AdminCommunityContentService {
  static async getCommunityVideos(communityId: string, page: number = 1, limit: number = 10): Promise<any[]> {
    const supabase = await createClient()

    try {
      const { data: videos, error } = await supabase
        .from('community_videos')
        .select(`
          id,
          video_type,
          title,
          description,
          video_url,
          video_provider,
          thumbnail_url,
          duration,
          order_index,
          is_active,
          metadata,
          created_at,
          updated_at
        `)
        .eq('community_id', communityId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1)

      if (error) {
        logger.error('Error fetching community videos', { error: error.message, communityId })
        return []
      }

      return videos || []
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityVideos', { error: error instanceof Error ? error.message : String(error), communityId })
      return []
    }
  }

  static async getCommunityPosts(communityId: string): Promise<any[]> {
    const supabase = await createClient()

    try {
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          id,
          content,
          attachment_url,
          attachment_type,
          likes_count,
          comments_count,
          is_pinned,
          is_hidden,
          is_edited,
          edited_at,
          created_at,
          updated_at,
          user_id
        `)
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsError) {
        logger.error('Error fetching community posts', { error: postsError.message, communityId })
        throw postsError
      }

      if (!posts || posts.length === 0) {
        return []
      }

      const userIds = [...new Set(posts.map(post => post.user_id).filter(Boolean))]
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name, profile_picture_url')
        .in('id', userIds)

      if (usersError) {
        logger.error('Error fetching users for posts', { error: usersError.message })
      }

      const usersMap = new Map()
      if (users) {
        users.forEach(user => {
          usersMap.set(user.id, user)
        })
      }

      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const { data: comments } = await supabase
            .from('community_comments')
            .select(`
              id,
              content,
              created_at,
              author_id,
              users!inner(display_name, first_name, last_name, profile_picture_url)
            `)
            .eq('post_id', post.id)
            .order('created_at', { ascending: true })
            .limit(10)

          const { data: reactions } = await supabase
            .from('community_reactions')
            .select(`
              id,
              reaction_type,
              emoji,
              users!inner(display_name, first_name, last_name)
            `)
            .eq('post_id', post.id)

          const reactionsGrouped = new Map()
          if (reactions) {
            reactions.forEach(reaction => {
              const key = reaction.reaction_type || 'like'
              if (!reactionsGrouped.has(key)) {
                reactionsGrouped.set(key, {
                  type: key,
                  emoji: reaction.emoji || '👍',
                  count: 0,
                  users: []
                })
              }
              const group = reactionsGrouped.get(key)
              group.count++
              group.users.push(reaction.users)
            })
          }

          return {
            ...post,
            users: usersMap.get(post.user_id) || null,
            comments: comments || [],
            reactions: Array.from(reactionsGrouped.values()),
            attachments: post.attachment_url ? [{ url: post.attachment_url, type: post.attachment_type, name: 'Archivo adjunto' }] : [],
            links: [],
            views_count: 0,
            post_type: 'text'
          }
        })
      )

      return postsWithDetails
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityPosts', { error: error instanceof Error ? error.message : String(error), communityId })
      throw error
    }
  }
}
