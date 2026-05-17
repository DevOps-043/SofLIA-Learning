import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

type Layer1ModerationResult =
  | { blocked: false }
  | { blocked: true; status: 400 | 403; body: Record<string, unknown> }

export async function runLayer1Moderation(
  supabase: SupabaseClient,
  content: string,
  userId: string,
): Promise<Layer1ModerationResult> {
  const { containsForbiddenContent, registerWarning } = await import('@/lib/moderation')
  const forbiddenCheck = await containsForbiddenContent(content, supabase)

  if (!forbiddenCheck.contains) return { blocked: false }

  try {
    const warningResult = await registerWarning(userId, content, 'post', supabase)

    if (warningResult.userBanned) {
      return {
        blocked: true,
        status: 403,
        body: { error: 'Has sido baneado del sistema.', banned: true },
      }
    }

    return {
      blocked: true,
      status: 400,
      body: {
        error: `El contenido contiene lenguaje inapropiado y ha sido bloqueado. ${warningResult.message}`,
        warning: true,
        warningCount: warningResult.warningCount,
        foundWords: forbiddenCheck.words,
      },
    }
  } catch (error) {
    logger.error('Error registering warning:', error)
    return {
      blocked: true,
      status: 400,
      body: { error: 'El contenido contiene lenguaje inapropiado y ha sido bloqueado.' },
    }
  }
}
