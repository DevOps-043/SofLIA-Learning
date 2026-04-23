import { NextResponse } from 'next/server';
import type {
  ExistingReactionRow,
  PostReactionsSupabaseClient,
} from './types';

export async function updateCurrentReaction(
  supabase: PostReactionsSupabaseClient,
  currentReaction: ExistingReactionRow,
  reactionType: string
) {
  const { error } = await supabase
    .from('community_reactions')
    .update({
      reaction_type: reactionType,
      created_at: new Date().toISOString(),
    })
    .eq('id', currentReaction.id);

  if (error) {
    return NextResponse.json(
      { error: 'Error al actualizar reacción' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Reacción actualizada',
    action: 'updated',
    previousReaction: currentReaction.reaction_type,
    newReaction: reactionType,
  });
}
