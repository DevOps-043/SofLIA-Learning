import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedCommentUser } from './auth';
import { scheduleCommentAIModeration } from './ai-moderation';
import { createCommunityCommentsClient } from './client';
import { incrementPostCommentCount } from './comment-counter';
import { createCommentRecord } from './create-comment';
import { findCommunityBySlug } from './community';
import { runCommentLayer1Moderation } from './layer1-moderation';
import { scheduleCommentNotification } from './notifications';
import { validateCommentRequestBody } from './request-body';
import { buildCommentUser } from './users';
import type { CommentRouteContext } from './types';

export async function handleCreateCommentRequest(
  request: NextRequest,
  { params }: CommentRouteContext
) {
  try {
    const supabase = await createCommunityCommentsClient();
    const user = await getAuthenticatedCommentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId, slug } = await params;
    const bodyResult = await validateCommentRequestBody(request);
    if (!bodyResult.ok) {
      return NextResponse.json(
        { error: bodyResult.error },
        { status: bodyResult.status }
      );
    }

    const { content, parentCommentId } = bodyResult.body;
    const moderation = await runCommentLayer1Moderation({
      content,
      userId: user.id,
      supabase,
    });
    if (!moderation.allowed) {
      return moderation.response;
    }

    const community = await findCommunityBySlug(supabase, slug);
    if (!community) {
      return NextResponse.json({ error: 'Comunidad no encontrada' }, { status: 404 });
    }

    const created = await createCommentRecord({
      supabase,
      postId,
      communityId: community.id,
      userId: user.id,
      content,
      parentCommentId,
    });
    if (!created.ok) {
      return NextResponse.json({ error: 'Error al crear comentario' }, { status: 500 });
    }

    await incrementPostCommentCount(supabase, postId);
    scheduleCommentNotification({
      supabase,
      postId,
      commentId: created.comment.id,
      authorId: user.id,
      content,
      communityId: community.id,
    });
    scheduleCommentAIModeration({
      supabase,
      postId,
      commentId: created.comment.id,
      userId: user.id,
      content,
    });

    return NextResponse.json({
      message: 'Comentario creado exitosamente',
      comment: { ...created.comment, user: buildCommentUser(user) },
      aiModerationPending: true,
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
