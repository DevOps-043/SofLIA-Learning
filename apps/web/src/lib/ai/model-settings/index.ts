/**
 * Configuración de modelos de IA por propósito.
 *
 * Este barrel expone SOLO las piezas isomorfas (catálogo, tipos, niveles de
 * razonamiento, validación). El servicio de resolución es `server-only` y debe
 * importarse por su ruta explícita:
 *
 *   import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
 *
 * De ese modo el panel de administración puede reutilizar catálogo y validación
 * en el navegador sin arrastrar el cliente de Supabase con service-role.
 */
export {
  AI_MODEL_PURPOSES,
  AI_MODEL_SETTINGS_LIMITS,
  PLATFORM_DEFAULT_GEMINI_MODEL,
  getAiModelPurpose,
  isAiModelPurposeId,
  type AiModelPurpose,
  type AiModelPurposeId,
} from './purposes'

export {
  buildManagedGenerationConfig,
  type ManagedGenerationConfig,
} from './generation-config'

export {
  AI_THINKING_LEVELS,
  buildThinkingConfig,
  isAiThinkingLevel,
  type AiThinkingLevel,
} from './thinking'

export type {
  AiModelPurposeDefinition,
  AiModelSettingsSource,
  AiModelSettingsUpdate,
  AiPurposeCapabilities,
  AiPurposeGroup,
  ResolvedAiModelSettings,
} from './types'

export {
  UnsupportedAiCapabilityError,
  aiModelSettingsUpdateSchema,
  assertUpdateMatchesCapabilities,
  type AiModelSettingsUpdateInput,
} from './validation'
