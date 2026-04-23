import type { CommentUserSource } from './types';

export async function getAuthenticatedCommentUser() {
  const { SessionService } = await import(
    '@/features/auth/services/session.service'
  );
  const user = await SessionService.getCurrentUser();

  return user as CommentUserSource | null;
}
