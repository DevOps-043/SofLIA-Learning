import { z } from 'zod'

import { AI_MODEL_SETTINGS_LIMITS, getAiModelPurpose, type AiModelPurposeId } from './purposes'
import { AI_THINKING_LEVELS } from './thinking'

/**
 * Contrato de entrada del endpoint de actualización.
 *
 * Se valida en dos niveles porque cada uno cubre un riesgo distinto:
 * 1. Este esquema comprueba forma, tipos y rangos genéricos.
 * 2. `assertUpdateMatchesCapabilities` rechaza parámetros que el propósito
 *    concreto no admite, para que el panel no pueda persistir configuración
 *    inerte (p. ej. una temperatura en un propósito de TTS).
 *
 * Los CHECK constraints de la tabla actúan como tercera red frente a escrituras
 * que no pasen por esta ruta.
 */
export const aiModelSettingsUpdateSchema = z
  .object({
    maxOutputTokens: z
      .number()
      .int()
      .min(AI_MODEL_SETTINGS_LIMITS.maxOutputTokens.min)
      .max(AI_MODEL_SETTINGS_LIMITS.maxOutputTokens.max)
      .nullable()
      .optional(),
    model: z
      .string()
      .trim()
      .regex(
        AI_MODEL_SETTINGS_LIMITS.modelPattern,
        'El identificador de modelo solo admite letras, números, punto, guion y guion bajo.',
      )
      .optional(),
    temperature: z
      .number()
      .min(AI_MODEL_SETTINGS_LIMITS.temperature.min)
      .max(AI_MODEL_SETTINGS_LIMITS.temperature.max)
      .nullable()
      .optional(),
    thinkingLevel: z.enum(AI_THINKING_LEVELS).optional(),
  })
  .strict()
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    { message: 'No se recibió ningún cambio.' },
  )

export type AiModelSettingsUpdateInput = z.infer<typeof aiModelSettingsUpdateSchema>

export class UnsupportedAiCapabilityError extends Error {
  constructor(capability: string, purposeId: string) {
    super(`El propósito "${purposeId}" no admite configurar "${capability}".`)
    this.name = 'UnsupportedAiCapabilityError'
  }
}

/**
 * Rechaza cambios sobre parámetros que el propósito no soporta.
 * Lanza `UnsupportedAiCapabilityError`, que la ruta traduce a un 400.
 */
export function assertUpdateMatchesCapabilities(
  purposeId: AiModelPurposeId,
  update: AiModelSettingsUpdateInput,
): void {
  const { capabilities } = getAiModelPurpose(purposeId)

  if (update.maxOutputTokens !== undefined && !capabilities.maxOutputTokens) {
    throw new UnsupportedAiCapabilityError('maxOutputTokens', purposeId)
  }

  if (update.temperature !== undefined && !capabilities.temperature) {
    throw new UnsupportedAiCapabilityError('temperature', purposeId)
  }

  if (
    update.thinkingLevel !== undefined &&
    update.thinkingLevel !== 'default' &&
    !capabilities.thinkingLevel
  ) {
    throw new UnsupportedAiCapabilityError('thinkingLevel', purposeId)
  }
}
