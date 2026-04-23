import type { SupabaseClient } from '@supabase/supabase-js';

export type PostReactionStatsSupabaseClient = SupabaseClient;

export interface PostReactionStatsRouteParams {
  slug: string;
  postId: string;
}

export interface PostReactionStatsRouteContext {
  params: Promise<PostReactionStatsRouteParams>;
}

export interface TopUserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
}

export interface CommunityReactionUserRow {
  user_id: string;
  user: TopUserRow;
}

export interface ReactionCountByUser {
  user: TopUserRow;
  count: number;
}

export interface PostStatsSummary {
  id: string;
  title: string;
  reaction_count: number;
  created_at: string;
}
