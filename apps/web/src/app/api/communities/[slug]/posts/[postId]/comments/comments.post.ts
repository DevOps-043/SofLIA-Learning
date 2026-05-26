import { NextRequest, NextResponse } from 'next/server';
import {
  createCommunityCommentSchema,
  type CreateCommunityCommentBody,
} from '@/app/api/communities/_schemas';
import { apiError } from '@/lib/api/errors';
import { sanitizeComment } from '@/lib/sanitize/html-sanitizer.shortcuts';
import {
  commentsTable,
  communitiesTable,
  createCommunityRouteClient,
} from './comments.client';
import { getCurrentCommunityUser } from './comments.auth';
import { scheduleAiCommentModeration, validateForbiddenCommentContent } from './comments.moderation';
import { schedulePostCommentNotification } from './comments.notifications';
import { buildCommentUser } from './comments.users';
import type { CommunityCommentInsertRow } from './comments.types';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export async function handlePostComment(
  _request: NextRequest,
  body: CreateCommunityCommentBody,
  params: Promise<{ slug: string; postId: string }>,
) {
  const supabase = await createCommunityRouteClient();
  const user = await getCurrentCommunityUser();

  if (!user) {
    return apiError('UNAUTHORIZED', 'No autorizado', 401);
  }

  const { postId, slug } = await params;
  const { parent_comment_id } = body;
  const content = sanitizeComment(body.content).trim();
  const validationError = validateCommentContent(content);
  if (validationError) return validationError;

  const moderationResponse = await validateForbiddenCommentContent(
    content,
    supabase,
    user.id,
  );
  if (moderationResponse) return moderationResponse;

  const { data: community, error: communityError } = await communitiesTable(supabase)
    .select('id')
    .eq('slug', slug)
    .single();

  if (communityError || !community) {
    return apiError('COMMUNITY_NOT_FOUND', 'Comunidad no encontrada', 404);
  }

  const payload: CommunityCommentInsertRow = {
    post_id: postId,
    community_id: community.id,
    user_id: user.id,
    content,
    parent_comment_id: parent_comment_id || null,
  };
  const { data: newComment, error: insertError } = await commentsTable(supabase)
    .insert(payload)
    .select(SELECT_COLUMNS.community_comments)
    .single();

  if (insertError) {
    return apiError('CREATE_COMMENT_FAILED', 'Error al crear comentario', 500);
  }

  await supabase.rpc('increment_comment_count', { post_id: postId });
  schedulePostCommentNotification({
    supabase,
    postId,
    commentId: newComment.id,
    currentUserId: user.id,
    content,
    communityId: community.id,
  });
  scheduleAiCommentModeration({
    supabase,
    userId: user.id,
    postId,
    commentId: newComment.id,
    content,
  });

  return NextResponse.json({
    message: 'Comentario creado exitosamente',
    comment: { ...newComment, user: buildCommentUser(user) },
    aiModerationPending: true,
  });
}

function validateCommentContent(content: string) {
  const parsed = createCommunityCommentSchema.shape.content.safeParse(content);

  if (!parsed.success) {
    return apiError(
      'INVALID_COMMENT_CONTENT',
      'El contenido del comentario es requerido',
      400,
      { details: parsed.error.flatten() },
    );
  }

  return null;
}
