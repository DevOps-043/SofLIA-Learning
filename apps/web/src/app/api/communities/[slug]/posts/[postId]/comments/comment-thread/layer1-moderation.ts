import { NextResponse } from 'next/server';
import type { CommentsSupabaseClient } from './types';

interface Layer1ModerationOptions {
  content: string;
  userId: string;
  supabase: CommentsSupabaseClient;
}

export async function runCommentLayer1Moderation({
  content,
  userId,
  supabase,
}: Layer1ModerationOptions) {
  const { containsForbiddenContent, registerWarning } = await import(
    '@/lib/moderation'
  );
  const forbiddenCheck = await containsForbiddenContent(content, supabase);

  if (!forbiddenCheck.contains) {
    return { allowed: true as const };
  }

  try {
    const warningResult = await registerWarning(userId, content, 'comment', supabase);

    if (warningResult.userBanned) {
      return forbiddenResponse(
        '❌ Has sido baneado del sistema por reiteradas violaciones de las reglas de la comunidad.',
        { banned: true },
        403
      );
    }

    return forbiddenResponse(
      `⚠️ El comentario contiene lenguaje inapropiado y ha sido bloqueado. ${warningResult.message}`,
      {
        warning: true,
        warningCount: warningResult.warningCount,
        foundWords: forbiddenCheck.words,
      }
    );
  } catch {
    return forbiddenResponse(
      'El contenido contiene lenguaje inapropiado y ha sido bloqueado.'
    );
  }
}

function forbiddenResponse(
  error: string,
  details: Record<string, unknown> = {},
  status = 400
) {
  return {
    allowed: false as const,
    response: NextResponse.json({ error, ...details }, { status }),
  };
}
