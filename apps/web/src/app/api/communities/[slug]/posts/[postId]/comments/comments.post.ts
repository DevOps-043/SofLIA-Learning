import { NextRequest, NextResponse } from 'next/server';
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

export async function handlePostComment(
  request: NextRequest,
  params: Promise<{ slug: string; postId: string }>,
) {
  const supabase = await createCommunityRouteClient();
  const user = await getCurrentCommunityUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { postId, slug } = await params;
  const { content, parent_comment_id } = await request.json();
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
    return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
  }

  const payload: CommunityCommentInsertRow = {
    post_id: postId,
    community_id: community.id,
    user_id: user.id,
    content: content.trim(),
    parent_comment_id: parent_comment_id || null,
  };
  const { data: newComment, error: insertError } = await commentsTable(supabase)
    .insert(payload)
    .select(SELECT_COLUMNS.community_comments)
    .single();

  if (insertError) {
    return NextResponse.json({ error: 'Error al crear comentario' }, { status: 500 });
  }

  await supabase.rpc('increment_comment_count', { post_id: postId });
  schedulePostCommentNotification({
    supabase,
    postId,
    commentId: newComment.id,
    currentUserId: user.id,
    content: content.trim(),
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
  if (!content || content.trim().length === 0) {
    return NextResponse.json(
      { error: 'El contenido del comentario es requerido' },
      { status: 400 },
    );
  }
  if (content.trim().length > 1000) {
    return NextResponse.json(
      { error: 'El comentario es demasiado largo' },
      { status: 400 },
    );
  }
  return null;
}
