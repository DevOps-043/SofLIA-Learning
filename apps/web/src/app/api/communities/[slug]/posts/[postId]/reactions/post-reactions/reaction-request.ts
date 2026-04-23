import type { NextRequest } from 'next/server';
import { VALID_REACTIONS } from './constants';
import type { ReactionValidation } from './types';

interface RawReactionBody {
  reaction_type?: unknown;
  action?: unknown;
}

export async function validateReactionRequest(
  request: NextRequest
): Promise<ReactionValidation> {
  const body = (await request.json()) as RawReactionBody;
  const reactionType =
    typeof body.reaction_type === 'string' ? body.reaction_type : '';

  if (!reactionType) {
    return { ok: false, error: 'Tipo de reacción requerido', status: 400 };
  }

  if (!VALID_REACTIONS.includes(reactionType as typeof VALID_REACTIONS[number])) {
    return {
      ok: false,
      error: 'Tipo de reacción inválido',
      status: 400,
      validTypes: VALID_REACTIONS,
    };
  }

  return {
    ok: true,
    reactionType,
    action: typeof body.action === 'string' ? body.action : null,
  };
}
