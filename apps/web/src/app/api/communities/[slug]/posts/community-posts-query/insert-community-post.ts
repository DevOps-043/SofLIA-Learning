import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'
import type { CreatePostOptions } from './types'

export async function insertCommunityPost(
  supabase: SupabaseClient,
  options: CreatePostOptions,
  communityId: string,
  validatedAttachmentType: string | null | undefined,
  validatedAttachmentData: Record<string, unknown> | null | undefined,
) {
  const { userId, body } = options
  const { title, content, attachment_url } = body
  const postInsertData = {
    community_id: communityId,
    user_id: userId,
    title: title || null,
    content: content!.trim(),
    attachment_url: attachment_url || null,
    attachment_type: validatedAttachmentType || null,
    attachment_data: validatedAttachmentData || null,
    likes_count: 0,
    comment_count: 0,
    reaction_count: 0,
    is_pinned: false,
    is_edited: false,
  }

  const { data: newPost, error: postError } = await supabase
    .from('community_posts')
    .insert(postInsertData)
    .select(`
      *,
      user:user_id (id, email, username, first_name, last_name, profile_picture_url)
    `)
    .single()

  if (postError) {
    logger.error('Error creating post:', postError)
    throw Object.assign(new Error(postError.message || 'Error desconocido'), {
      status: 500,
      code: postError.code,
    })
  }

  return newPost
}
