import { NextResponse } from 'next/server';
import type {
  ExistingReactionRow,
  PostReactionsSupabaseClient,
} from './types';

export async function removeCurrentReaction(
  supabase: PostReactionsSupabaseClient,
  currentReaction: ExistingReactionRow | null
) {
  if (!currentReaction) {
    return NextResponse.json({
      message: 'No hay reacción para eliminar',
      action: 'none',
    });
  }

  const { error } = await supabase
    .from('community_reactions')
    .delete()
    .eq('id', currentReaction.id);

  if (error) {
    return NextResponse.json(
      { error: 'Error al eliminar reacción' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: 'Reacción eliminada',
    action: 'removed',
    previousReaction: currentReaction.reaction_type,
  });
}
