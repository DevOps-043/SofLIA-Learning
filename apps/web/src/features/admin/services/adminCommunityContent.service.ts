import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'
import { fromLoose } from '../../../lib/supabase/looseQuery'
import {
  buildCommunityPosts,
  type CommunityBuiltPost,
  type CommunityCommentRecord,
  type CommunityPostRecord,
  type CommunityReactionRecord,
  type CommunityVideoRecord,
  groupCommentsByPost,
  groupReactionsByPost
} from './adminCommunityContent.helpers'

export class AdminCommunityContentService {
  static async getCommunityVideos(communityId: string, page: number = 1, limit: number = 10): Promise<CommunityVideoRecord[]> {
    const supabase = await createClient()

    try {
      const { data: videos, error } = await fromLoose<CommunityVideoRecord>(supabase, 'community_videos')
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

  static async getCommunityPosts(communityId: string): Promise<CommunityBuiltPost[]> {
    const supabase = await createClient()

    try {
      const { data: posts, error: postsError } = await fromLoose<CommunityPostRecord>(supabase, 'community_posts')
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

      const postIds = posts.map(post => post.id)
      const userIds = [...new Set(posts.map(post => post.user_id).filter((userId): userId is string => Boolean(userId)))]

      const [{ data: users, error: usersError }, { data: comments, error: commentsError }, { data: reactions, error: reactionsError }] = await Promise.all([
        userIds.length
          ? supabase.from('users').select('id, display_name, first_name, last_name, profile_picture_url').in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
        fromLoose<CommunityCommentRecord>(supabase, 'community_comments')
          .select(`
            id,
            post_id,
            content,
            created_at,
            author_id,
            users!inner(id, display_name, first_name, last_name, profile_picture_url)
          `)
          .in('post_id', postIds)
          .order('created_at', { ascending: true })
          .limit(postIds.length * 10 || 10),
        fromLoose<CommunityReactionRecord>(supabase, 'community_reactions')
          .select(`
            id,
            post_id,
            reaction_type,
            emoji,
            users!inner(id, display_name, first_name, last_name)
          `)
          .in('post_id', postIds)
          .limit(postIds.length * 10 || 10)
      ])

      if (usersError) {
        logger.error('Error fetching users for posts', { error: usersError.message })
      }

      if (commentsError) {
        logger.error('Error fetching comments for posts', { error: commentsError.message, communityId })
      }

      if (reactionsError) {
        logger.error('Error fetching reactions for posts', { error: reactionsError.message, communityId })
      }

      const usersById = new Map((users || []).map(user => [user.id, user]))
      const commentsByPost = groupCommentsByPost(comments || [])
      const reactionsByPost = groupReactionsByPost(reactions || [])

      return buildCommunityPosts(posts, usersById, commentsByPost, reactionsByPost)
    } catch (error) {
      logger.error('Error in AdminCommunitiesService.getCommunityPosts', { error: error instanceof Error ? error.message : String(error), communityId })
      throw error
    }
  }
}
