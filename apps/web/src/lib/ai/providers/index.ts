/**
 * Capa de proveedores de IA.
 *
 * Este barrel expone SOLO las piezas isomorfas (registro de proveedores, tipos,
 * mapeo de razonamiento), para que el panel de administración pueda deducir el
 * proveedor en el navegador sin arrastrar los SDK del servidor.
 *
 * El gateway y los adaptadores son `server-only` y se importan por su ruta:
 *
 *   import { generateAiText } from '@/lib/ai/providers/ai-text-gateway.server'
 */
export {
  AI_PROVIDERS,
  AI_PROVIDER_SELECTIONS,
  inferAiProvider,
  isAiProvider,
  isAiProviderSelection,
  resolveAiProvider,
  supportsOpenAiMinimalReasoning,
  supportsOpenAiReasoning,
  supportsOpenAiTemperature,
  type AiProvider,
  type AiProviderSelection,
} from './provider-registry'

export {
  OPENAI_REASONING_EFFORTS,
  buildOpenAiReasoningEffort,
  type OpenAiReasoningEffort,
} from './openai-reasoning'

export {
  UnsupportedAiRequestError,
  type AiContentPart,
  type AiGenerationRequest,
  type AiGenerationResult,
  type AiInlineDataPart,
  type AiJsonSchema,
  type AiTextAdapter,
  type AiTextPart,
  type AiTurn,
  type AiUsage,
} from './types'
