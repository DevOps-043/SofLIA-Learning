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
