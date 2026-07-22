import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'

/**
 * Modelo de moderación, resuelto por llamada.
 *
 * Antes era una constante de módulo leída del entorno; se convirtió en función
 * porque la configuración es administrable en caliente y una constante evaluada
 * al cargar el módulo quedaría congelada hasta reiniciar el proceso.
 */
export async function resolveAiModerationModel(): Promise<string> {
  const settings = await getAiModelSettings('ai_moderation')
  return settings.model
}

export const AI_MODERATION_ENABLED =
  process.env.AI_MODERATION_ENABLED === 'true' ||
  process.env.GEMINI_MODERATION_ENABLED === 'true'
export const CONFIDENCE_THRESHOLD = Number.parseFloat(
  process.env.AI_MODERATION_CONFIDENCE_THRESHOLD || '0.7',
)
export const AUTO_BAN_THRESHOLD = Number.parseFloat(
  process.env.AI_MODERATION_AUTO_BAN_THRESHOLD || '0.95',
)
