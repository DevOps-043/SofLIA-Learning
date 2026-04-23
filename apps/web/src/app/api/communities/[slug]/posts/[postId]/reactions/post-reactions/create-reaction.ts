import { NextResponse } from 'next/server';
import { scheduleReactionNotification } from './reaction-notifications';
import type { PostReactionsSupabaseClient } from './types';

interface CreateReactionOptions {
  supabase: PostReactionsSupabaseClient;
  postId: string;
  userId: string;
  reactionType: string;
}

export async function createPostReaction({
  supabase,
  postId,
  userId,
  reactionType,
}: CreateReactionOptions) {
  const { data: newReaction, error } = await supabase
    .from('community_reactions')
    .insert({ post_id: postId, user_id: userId, reaction_type: reactionType })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Error al crear reacción' },
      { status: 500 }
    );
  }

  scheduleReactionNotification({ supabase, postId, authorId: userId, reactionType });

  return NextResponse.json({
    message: 'Reacción agregada',
    action: 'added',
    reaction: newReaction,
  });
}
