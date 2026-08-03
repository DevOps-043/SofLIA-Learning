import { z } from 'zod'

import { ATTEMPT_UNLOCK_SCOPES } from '@/features/courses/services/attempt-unlocks/attempt-unlock.types'

/**
 * Contrato de la concesión de intentos. Las referencias son opcionales porque el
 * ámbito depende del motor (quiz → lección/material, diálogo y actividad LIA →
 * actividad); la coherencia scope↔referencia se valida abajo y, como última barrera,
 * en el CHECK de la tabla.
 */
export const grantAttemptUnlockSchema = z
  .object({
    scope: z.enum(ATTEMPT_UNLOCK_SCOPES as unknown as [string, ...string[]]),
    lessonId: z.string().uuid().nullish(),
    materialId: z.string().uuid().nullish(),
    activityId: z.string().uuid().nullish(),
    enrollmentId: z.string().uuid().nullish(),
    reason: z.string().trim().min(3).max(500).nullish(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === 'quiz' && !value.lessonId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lessonId'],
        message: 'Un desbloqueo de quiz requiere la lección.',
      })
    }
    if (value.scope !== 'quiz' && !value.activityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activityId'],
        message: 'Un desbloqueo de actividad requiere el identificador de la actividad.',
      })
    }
  })

export type GrantAttemptUnlockBody = z.infer<typeof grantAttemptUnlockSchema>
