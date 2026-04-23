import type { SupabaseClient } from '@supabase/supabase-js';

export type PostReactionsSupabaseClient = SupabaseClient;

export interface PostReactionRouteParams {
  slug: string;
  postId: string;
}

export interface PostReactionRouteContext {
  params: Promise<PostReactionRouteParams>;
}

export interface CommunityReactionUserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  profile_picture_url: string | null;
}

export interface CommunityReactionRow {
  id: string;
  reaction_type: string;
  created_at: string;
  user_id: string;
  user: CommunityReactionUserRow;
}

export interface ExistingReactionRow {
  id: string;
  reaction_type: string;
}

export interface GroupedReactionUser {
  id: string;
  name: string;
  avatar: string | null;
  reaction_type: string;
  created_at: string;
}

export interface GroupedReaction {
  type: string;
  count: number;
  users: GroupedReactionUser[];
  hasUserReacted: boolean;
  emoji: string;
}

export type ReactionValidation =
  | { ok: true; reactionType: string; action: string | null }
  | { ok: false; error: string; status: number; validTypes?: readonly string[] };
