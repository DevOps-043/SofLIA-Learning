import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedCommentUser } from './auth';
import { createCommunityCommentsClient } from './client';
import { listPostComments } from './list-comments';
import { parseCommentPagination } from './pagination';
import type { CommentRouteContext } from './types';

export async function handleGetCommentsRequest(
  request: NextRequest,
  { params }: CommentRouteContext
) {
  try {
    const supabase = await createCommunityCommentsClient();
    const user = await getAuthenticatedCommentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { postId } = await params;
    const result = await listPostComments(
      supabase,
      postId,
      parseCommentPagination(request.url)
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      comments: result.comments,
      pagination: result.pagination,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
