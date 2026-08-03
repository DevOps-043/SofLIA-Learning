import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireAdmin, type AdminAuth } from '@/lib/auth/requireAdmin'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { grantAttemptUnlock } from '@/features/courses/services/attempt-unlocks/attempt-unlock.server.service'
import type { AttemptUnlockScope } from '@/features/courses/services/attempt-unlocks/attempt-unlock.types'

import { grantAttemptUnlockSchema, type GrantAttemptUnlockBody } from './schema'

type UnlockContext = { params: Promise<{ id: string }> }

async function grant(
  body: GrantAttemptUnlockBody,
  targetUserId: string,
  auth: AdminAuth,
): Promise<Response> {
  try {
    const unlock = await grantAttemptUnlock(createAdminClient(), {
      userId: targetUserId,
      scope: body.scope as AttemptUnlockScope,
      lessonId: body.lessonId ?? null,
      materialId: body.materialId ?? null,
      activityId: body.activityId ?? null,
      enrollmentId: body.enrollmentId ?? null,
      grantedByUserId: auth.userId,
      reason: body.reason ?? null,
    })

    logger.warn('security.admin_granted_attempt_unlock', {
      actorUserId: auth.userId,
      scope: unlock.scope,
      targetUserId,
      unlockId: unlock.unlockId,
    })

    return NextResponse.json({ success: true, unlock })
  } catch (error) {
    logger.error('security.admin_grant_attempt_unlock_failed', {
      error: error instanceof Error ? error.message : 'unknown',
      scope: body.scope,
      targetUserId,
    })
    return apiError('ATTEMPT_UNLOCK_FAILED', 'No se pudo devolver los intentos al usuario.', 500)
  }
}

/**
 * Devuelve intentos a un alumno bloqueado por el tope de un quiz o de una actividad
 * (super-admin). NO borra intentos: registra una concesión con punto de corte, de modo
 * que la auditoría forense conserva la historia completa y el dictamen pericial sigue
 * siendo válido.
 *
 * Se autentica ANTES de leer el cuerpo: una petición sin permisos no debe llegar
 * siquiera a la validación. La acción queda en el log de seguridad con actor, alumno,
 * ámbito y motivo.
 */
export async function POST(request: NextRequest, context: UnlockContext): Promise<Response> {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const { id: targetUserId } = await context.params
  if (!targetUserId) {
    return apiError('MISSING_USER_ID', 'Falta el identificador del usuario.', 400)
  }

  const validated = withZodBody<GrantAttemptUnlockBody, UnlockContext>(
    grantAttemptUnlockSchema,
    (_req, body) => grant(body, targetUserId, auth),
  )

  return validated(request, context)
}
