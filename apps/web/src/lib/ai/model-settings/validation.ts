import { z } from 'zod'

import {
  AI_PROVIDER_SELECTIONS,
  inferAiProvider,
  resolveAiProvider,
  type AiProvider,
} from '../providers/provider-registry'

import {
  AI_MODEL_SETTINGS_LIMITS,
  PLATFORM_DEFAULT_AI_PROVIDER,
  getAiModelPurpose,
  getPurposeSupportedProviders,
  isProviderSupportedByPurpose,
  type AiModelPurposeId,
} from './purposes'
import { AI_THINKING_LEVELS } from './thinking'

/**
 * Contrato de entrada del endpoint de actualización.
 *
 * Se valida en tres niveles porque cada uno cubre un riesgo distinto:
 * 1. Este esquema comprueba forma, tipos y rangos genéricos.
 * 2. `assertUpdateMatchesCapabilities` rechaza parámetros que el propósito
 *    concreto no admite, para que el panel no pueda persistir configuración
 *    inerte (p. ej. una temperatura en un propósito que no la usa).
 * 3. `assertProviderIsResolvable` garantiza que el modelo guardado tenga un
 *    proveedor al que enviarlo y que ese proveedor sirva para el propósito.
 *
 * Los CHECK constraints de la tabla actúan como cuarta red frente a escrituras
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
        'El identificador de modelo solo admite letras, números, punto, dos puntos, guion y guion bajo.',
      )
      .optional(),
    provider: z.enum(AI_PROVIDER_SELECTIONS).optional(),
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

/** Error de configuración de proveedor. La ruta lo traduce a un 400. */
export class UnresolvableAiProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnresolvableAiProviderError'
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

/**
 * Garantiza que la combinación modelo + proveedor que se va a guardar sea
 * ejecutable.
 *
 * POR QUÉ AL GUARDAR Y NO AL LLAMAR: si un modelo desconocido se aceptara con un
 * proveedor deducido por defecto, la errata se descubriría cuando un empleado
 * usara la funcionalidad, con un error opaco del proveedor y sin pista de que la
 * causa está en el panel. Validarlo aquí convierte ese incidente de producción
 * en un mensaje inmediato al administrador que lo escribió.
 *
 * `currentModel` es el modelo vigente: el panel puede enviar solo el proveedor,
 * y la comprobación debe hacerse sobre la combinación resultante, no sobre el
 * cambio aislado.
 */
export function assertProviderIsResolvable(params: {
  currentModel: string
  currentProviderSelection: AiModelSettingsUpdateInput['provider']
  purposeId: AiModelPurposeId
  update: AiModelSettingsUpdateInput
}): AiProvider {
  const purpose = getAiModelPurpose(params.purposeId)
  const model = params.update.model ?? params.currentModel
  const selection = params.update.provider ?? params.currentProviderSelection ?? 'auto'

  if (selection === 'auto' && inferAiProvider(model) === null) {
    throw new UnresolvableAiProviderError(
      `No se pudo deducir el proveedor del modelo "${model}". Selecciónalo manualmente (Gemini u OpenAI) o revisa el identificador.`,
    )
  }

  const provider = resolveAiProvider({
    fallback: PLATFORM_DEFAULT_AI_PROVIDER,
    model,
    selection,
  })

  if (!isProviderSupportedByPurpose(purpose, provider)) {
    const supported = getPurposeSupportedProviders(purpose).join(', ')
    throw new UnresolvableAiProviderError(
      `El propósito "${params.purposeId}" solo admite estos proveedores: ${supported}.`,
    )
  }

  return provider
}
