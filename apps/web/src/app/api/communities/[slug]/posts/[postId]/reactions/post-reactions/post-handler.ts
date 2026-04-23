import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedPostReactionUser } from './auth';
import { createPostReaction } from './create-reaction';
import { fetchCurrentUserReaction } from './existing-reaction';
import { removeCurrentReaction } from './remove-reaction';
import { updateCurrentReaction } from './update-reaction';
import { validateReactionRequest } from './reaction-request';
import type { PostReactionRouteContext } from './types';

export async function handlePostReactionRequest(
  request: NextRequest,
  { params }: PostReactionRouteContext
) {
  try {
    const supabase = await createClient();
    const user = await getAuthenticatedPostReactionUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const validation = await validateReactionRequest(request);
    if (!validation.ok) {
      const { error, status, validTypes } = validation;
      return NextResponse.json({ error, validTypes }, { status });
    }

    const { postId } = await params;
    const { currentReaction, error } = await fetchCurrentUserReaction(
      supabase,
      postId,
      user.id
    );

    if (error) {
      return NextResponse.json({ error: 'Error al verificar reacciones' }, { status: 500 });
    }

    if (shouldRemoveReaction(validation.action, currentReaction, validation.reactionType)) {
      return removeCurrentReaction(supabase, currentReaction);
    }

    if (currentReaction) {
      return updateCurrentReaction(
        supabase,
        currentReaction,
        validation.reactionType
      );
    }

    return createPostReaction({
      supabase,
      postId,
      userId: user.id,
      reactionType: validation.reactionType,
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

function shouldRemoveReaction(
  action: string | null,
  currentReaction: { reaction_type: string } | null,
  reactionType: string
) {
  return action === 'remove' || currentReaction?.reaction_type === reactionType;
}
