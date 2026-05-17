import { NextResponse } from 'next/server';
import { deleteInappropriateComment } from './comments.moderation-delete';

export async function validateForbiddenCommentContent(
  content: string,
  supabase: unknown,
  userId: string,
) {
  const {
    containsForbiddenContent,
    registerWarning,
  } = await import('../../../../../../../lib/moderation');
  const forbiddenCheck = await containsForbiddenContent(content, supabase);

  if (!forbiddenCheck.contains) {
    return null;
  }

  try {
    const warningResult = await registerWarning(userId, content, 'comment', supabase);

    if (warningResult.userBanned) {
      return NextResponse.json(
        {
          error: 'Has sido baneado del sistema por reiteradas violaciones de las reglas de la comunidad.',
          banned: true,
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        error: `El comentario contiene lenguaje inapropiado y ha sido bloqueado. ${warningResult.message}`,
        warning: true,
        warningCount: warningResult.warningCount,
        foundWords: forbiddenCheck.words,
      },
      { status: 400 },
    );
  } catch {
    return NextResponse.json(
      { error: 'El contenido contiene lenguaje inapropiado y ha sido bloqueado.' },
      { status: 400 },
    );
  }
}

export function scheduleAiCommentModeration(params: {
  supabase: unknown
  userId: string
  postId: string
  commentId: string
  content: string
}) {
  const { supabase, userId, postId, commentId, content } = params;

  void (async () => {
    try {
      const {
        analyzeContentWithAI,
        logAIModerationAnalysis,
      } = await import('../../../../../../../lib/ai-moderation');
      const { registerWarning, getUserWarningsCount } = await import(
        '../../../../../../../lib/moderation'
      );
      const aiResult = await analyzeContentWithAI(content, {
        contentType: 'comment',
        userId,
        previousWarnings: await getUserWarningsCount(userId, supabase),
      });

      await logAIModerationAnalysis(userId, 'comment', commentId, content, aiResult, supabase);

      if (!aiResult.isInappropriate) return;

      await deleteInappropriateComment({ supabase, postId, commentId });
      await registerWarning(userId, content, 'comment', supabase);
    } catch {
      // Background moderation must not affect the response.
    }
  })();
}
