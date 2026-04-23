import type {
  CommentUserSource,
  CommentUserSummary,
  CommentsSupabaseClient,
} from './types';

export function getFallbackUser(userId: string): CommentUserSummary {
  return {
    id: userId,
    full_name: 'Usuario',
    avatar_url: null,
    username: 'usuario',
  };
}

export function buildCommentUser(user: CommentUserSource): CommentUserSummary {
  return {
    id: user.id,
    full_name:
      user.display_name ||
      (user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : null) ||
      user.username ||
      'usuario',
    avatar_url: user.profile_picture_url ?? null,
    username: user.username ?? 'usuario',
  };
}

export async function fetchCommentUsersMap(
  supabase: CommentsSupabaseClient,
  userIds: string[]
) {
  const usersMap = new Map<string, CommentUserSummary>();
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean);

  if (uniqueUserIds.length === 0) {
    return usersMap;
  }

  const { data: users } = await supabase
    .from('users')
    .select('id, username, first_name, last_name, display_name, profile_picture_url')
    .in('id', uniqueUserIds);

  users?.forEach((user) => {
    usersMap.set(user.id, buildCommentUser(user));
  });

  return usersMap;
}
