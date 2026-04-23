import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';
import { CreatePostOptions } from './types';

export async function insertCommunityPost(
  supabase: SupabaseClient,
  options: CreatePostOptions,
  communityId: string,
  validatedAttachmentType: string | null | undefined,
  validatedAttachmentData: Record<string, unknown> | null | undefined
) {
  const { userId, body } = options;
  const postInsertData = buildPostInsertData(
    communityId,
    userId,
    body,
    validatedAttachmentType,
    validatedAttachmentData
  );

  logger.log('Inserting post with data:', getInsertLogPayload(postInsertData));

  const { data: newPost, error: postError } = await supabase
    .from('community_posts')
    .insert(postInsertData)
    .select(
      `
      *,
      user:user_id (id, email, username, first_name, last_name, profile_picture_url)
    `
    )
    .single();

  if (!postError) return newPost;

  logger.error('Error creating post:', postError);
  logger.error('Post data that failed:', getInsertErrorPayload(body, validatedAttachmentType, postError));
  throw Object.assign(new Error(postError.message || 'Error desconocido'), {
    status: 500,
    code: postError.code,
  });
}

function buildPostInsertData(
  communityId: string,
  userId: string,
  body: CreatePostOptions['body'],
  attachmentType: string | null | undefined,
  attachmentData: Record<string, unknown> | null | undefined
) {
  return {
    community_id: communityId,
    user_id: userId,
    title: body.title || null,
    content: body.content!.trim(),
    attachment_url: body.attachment_url || null,
    attachment_type: attachmentType || null,
    attachment_data: attachmentData || null,
    likes_count: 0,
    comment_count: 0,
    reaction_count: 0,
    is_pinned: false,
    is_edited: false,
  };
}

function getInsertLogPayload(postInsertData: ReturnType<typeof buildPostInsertData>) {
  return {
    community_id: postInsertData.community_id,
    user_id: postInsertData.user_id,
    has_attachment: Boolean(postInsertData.attachment_url),
    attachment_type: postInsertData.attachment_type,
    has_attachment_data: Boolean(postInsertData.attachment_data),
  };
}

function getInsertErrorPayload(
  body: CreatePostOptions['body'],
  attachmentType: string | null | undefined,
  postError: { code?: string; details?: string; hint?: string; message: string }
) {
  const attachmentData =
    typeof body.attachment_data === 'object' && body.attachment_data !== null
      ? body.attachment_data
      : null;

  return {
    attachment_type: attachmentType,
    attachment_url: body.attachment_url?.substring(0, 100) ?? null,
    attachment_data_keys: attachmentData ? Object.keys(attachmentData) : null,
    attachment_data_preview: attachmentData ? JSON.stringify(attachmentData).substring(0, 500) : null,
    error_code: postError.code,
    error_message: postError.message,
    error_details: postError.details,
    error_hint: postError.hint,
  };
}
