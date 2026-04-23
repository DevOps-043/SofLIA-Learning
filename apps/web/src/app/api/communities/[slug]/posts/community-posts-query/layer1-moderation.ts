import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

export async function runLayer1Moderation(
  supabase: SupabaseClient,
  content: string,
  userId: string
): Promise<
  | { blocked: false }
  | { blocked: true; status: 400 | 403; body: Record<string, unknown> }
> {
  const { containsForbiddenContent, registerWarning } = await import(
    '../../../../../../lib/moderation'
  );

  const forbiddenCheck = await containsForbiddenContent(content, supabase);
  if (!forbiddenCheck.contains) return { blocked: false };

  try {
    const warningResult = await registerWarning(userId, content, 'post', supabase);

    if (warningResult.userBanned) {
      return {
        blocked: true,
        status: 403,
        body: {
          error: 'Has sido baneado del sistema por reiteradas violaciones de las reglas.',
          banned: true,
        },
      };
    }

    return {
      blocked: true,
      status: 400,
      body: {
        error: `El contenido fue bloqueado por lenguaje inapropiado. ${warningResult.message}`,
        warning: true,
        warningCount: warningResult.warningCount,
        // foundWords intentionally omitted — exposing blocked words helps attackers bypass the filter
      },
    };
  } catch (error) {
    logger.error('Error registering warning:', error);
    return {
      blocked: true,
      status: 400,
      body: { error: 'El contenido contiene lenguaje inapropiado y ha sido bloqueado.' },
    };
  }
}
