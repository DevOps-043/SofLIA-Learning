import type { CommentPagination } from './types';

export function parseCommentPagination(url: string): CommentPagination {
  const searchParams = new URL(url).searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}
