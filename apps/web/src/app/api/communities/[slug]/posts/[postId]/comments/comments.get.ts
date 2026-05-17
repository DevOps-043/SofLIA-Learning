import { NextRequest, NextResponse } from 'next/server';
import { commentsTable, createCommunityRouteClient } from './comments.client';
import { getCurrentCommunityUser } from './comments.auth';
import { fetchCommentUsersMap, getFallbackUser } from './comments.users';

export async function handleGetComments(
  request: NextRequest,
  params: Promise<{ slug: string; postId: string }>,
) {
  const supabase = await createCommunityRouteClient();
  const user = await getCurrentCommunityUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { postId } = await params;
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  const { data: comments, error } = await commentsTable(supabase)
    .select('*')
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .is('parent_comment_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: 'Error al obtener comentarios' },
      { status: 500 },
    );
  }

  const topLevelComments = comments ?? [];
  const userIds = [...new Set(topLevelComments.map((comment) => comment.user_id))];
  const usersMap = await fetchCommentUsersMap(supabase, userIds);
  const commentsWithReplies = await Promise.all(
    topLevelComments.map(async (comment) => {
      const { data: replies } = await commentsTable(supabase)
        .select('*')
        .eq('parent_comment_id', comment.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      return {
        ...comment,
        user: usersMap.get(comment.user_id) || getFallbackUser(comment.user_id),
        replies: (replies || []).map((reply) => ({
          ...reply,
          user: usersMap.get(reply.user_id) || getFallbackUser(reply.user_id),
        })),
      };
    }),
  );

  const { count: totalComments } = await commentsTable(supabase)
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
    .eq('is_deleted', false)
    .is('parent_comment_id', null);

  return NextResponse.json({
    comments: commentsWithReplies,
    pagination: {
      page,
      limit,
      total: totalComments || 0,
      totalPages: Math.ceil((totalComments || 0) / limit),
    },
  });
}
