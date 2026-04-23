export interface CommunityPostRequestBody {
  title?: string;
  content?: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_data?: Record<string, unknown> | string | null;
}

export interface GetPostsOptions {
  slug: string;
  limit: number;
  cursor: string | null;
  userId?: string;
}

export interface GetPostsResult {
  posts: Record<string, unknown>[];
  total: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export type AccessCheckResult =
  | { allowed: true }
  | { allowed: false; status: 401 | 403; body: Record<string, unknown> };

export interface CreatePostOptions {
  slug: string;
  userId: string;
  userEmail?: string;
  body: CommunityPostRequestBody;
}

export interface CreatePostResult {
  post: Record<string, unknown>;
  success: true;
  aiModerationPending: true;
}

export interface CommunityRecord {
  id: string;
  access_type: string;
  slug: string;
  member_count?: number | null;
}

export interface CommunityMembership {
  id: string;
}

export interface CommunityPostRecord extends Record<string, unknown> {
  id: string;
  created_at: string;
  attachment_type?: string | null;
  attachment_data?: Record<string, unknown> | null;
}

export interface PostReactionRecord {
  post_id: string;
  reaction_type: string;
}
