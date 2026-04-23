import type { SupabaseClient } from '@supabase/supabase-js';

export type CommentsSupabaseClient = SupabaseClient;

export interface CommentRouteParams {
  slug: string;
  postId: string;
}

export interface CommentRouteContext {
  params: Promise<CommentRouteParams>;
}

export interface CommunityCommentRow {
  id: string;
  post_id: string;
  community_id: string;
  user_id: string;
  content: string;
  parent_comment_id: string | null;
  is_deleted: boolean | null;
  created_at: string;
  [key: string]: unknown;
}

export interface CommunityCommentInsertRow {
  post_id: string;
  community_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string | null;
}

export interface CommunityLookupRow {
  id: string;
}

export interface CommentUserSummary {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

export interface CommentUserSource {
  id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  profile_picture_url?: string | null;
  username?: string | null;
}

export interface CommentPagination {
  page: number;
  limit: number;
  offset: number;
}

export type CommentReplyResponse = CommunityCommentRow & {
  user: CommentUserSummary;
};

export type CommentResponse = CommunityCommentRow & {
  user: CommentUserSummary;
  replies: CommentReplyResponse[];
};

export interface ValidCommentBody {
  content: string;
  parentCommentId: string | null;
}

export type CommentBodyValidation =
  | { ok: true; body: ValidCommentBody }
  | { ok: false; error: string; status: number };
