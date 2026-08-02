import { AI_PROVIDERS, type AiProvider } from '../providers/provider-registry'
import type { AiModelPurposeDefinition } from './types'

/**
 * Catálogo de propósitos de IA de la plataforma.
 *
 * Cada propósito representa un uso funcional distinto del modelo (SofLIA general,
 * SofLIA dentro de las actividades de un curso, moderación, traducción, ...) y es
 * configurable de forma independiente desde el panel de superadmin.
 *
 * INVARIANTES:
 * - Los `defaults` de este archivo replican EXACTAMENTE los valores que cada punto
 *   de llamada usaba cuando la configuración vivía en variables de entorno. Al
 *   desplegar sin ningún override en base de datos, el comportamiento en runtime
 *   es idéntico al anterior.
 * - `legacyModelEnvVars` conserva el orden de precedencia original de las variables
 *   de entorno, que se siguen respetando como fallback cuando no hay override.
 * - Añadir un propósito aquí es suficiente para que aparezca en el panel; la base de
 *   datos no necesita fila alguna hasta que un administrador cambie algo.
 */

/** Modelo por defecto de la plataforma cuando un propósito no define otro. */
export const PLATFORM_DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash'

/**
 * Proveedor al que se atribuye un propósito cuando el nombre del modelo no
 * permite deducirlo y no hay selección explícita. Es Gemini porque todos los
 * defaults del catálogo son modelos de Gemini: mantiene el comportamiento
 * histórico ante cualquier valor heredado del entorno que no reconozcamos.
 */
export const PLATFORM_DEFAULT_AI_PROVIDER: AiProvider = 'google'

/**
 * Límites de validación, compartidos por el formulario del panel y por la API.
 * Deben permanecer alineados con los CHECK constraints de las migraciones
 * `20260722140000_create_ai_model_settings.sql` y
 * `20260801120000_add_ai_model_settings_provider.sql`.
 */
// El mínimo de tokens es 1, no un valor "seguro" alto: el presupuesto adecuado
// depende del propósito. Un clasificador legítimamente usa poquísimos tokens
// (detección de idioma: ~10, devuelve "es"/"en"/"pt"; intención: ~200, un JSON
// corto). Un mínimo global alto rechazaría esos defaults al guardarlos.
//
// `modelPattern` admite además `:` porque los modelos afinados de OpenAI se
// identifican como `ft:gpt-4.1-mini:organizacion::AbC123`.
export const AI_MODEL_SETTINGS_LIMITS = {
  maxOutputTokens: { max: 65_536, min: 1 },
  modelPattern: /^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,119}$/,
  temperature: { max: 2, min: 0 },
} as const

const ALL_CAPABILITIES = {
  maxOutputTokens: true,
  temperature: true,
  thinkingLevel: true,
} as const

/**
 * Propósitos que solo puede atender Gemini porque envían contenido binario
 * (audio, vídeo) que el contrato neutral únicamente sabe traducir a ese
 * proveedor. OpenAI cubre esos casos con APIs distintas (transcripción), no con
 * generación de texto, por lo que no es un cambio de modelo sino de integración.
 */
const GOOGLE_ONLY: readonly AiProvider[] = ['google']

export const AI_MODEL_PURPOSES = [
  // ── SofLIA (asistente conversacional) ────────────────────────────────────
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 8_192,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.7,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.liaGeneral.description',
    group: 'soflia',
    id: 'lia_general',
    labelKey: 'aiSettings.purposes.liaGeneral.label',
    legacyMaxOutputTokensEnvVar: 'GEMINI_MAX_TOKENS',
    legacyModelEnvVars: ['LIA_CHAT_GEMINI_MODEL', 'GEMINI_MODEL'],
    legacyTemperatureEnvVar: 'GEMINI_TEMPERATURE',
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 200,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.2,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.liaIntent.description',
    group: 'soflia',
    id: 'lia_intent',
    labelKey: 'aiSettings.purposes.liaIntent.label',
    legacyModelEnvVars: ['AI_INTENT_GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 1_200,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.1,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.liaDictation.description',
    group: 'soflia',
    id: 'lia_dictation',
    labelKey: 'aiSettings.purposes.liaDictation.label',
    legacyModelEnvVars: ['GEMINI_TRANSCRIPTION_MODEL'],
    // Envía el audio dictado como contenido en línea.
    supportedProviders: GOOGLE_ONLY,
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 2_048,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.6,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.liaLessonSuggestions.description',
    group: 'soflia',
    id: 'lia_lesson_suggestions',
    labelKey: 'aiSettings.purposes.liaLessonSuggestions.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },

  // ── SofLIA dentro de las actividades de un curso ─────────────────────────
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      // `null` = el presupuesto lo deriva la propia actividad a partir del número
      // máximo de frases configurado en su rúbrica; un override aquí lo fija.
      maxOutputTokens: null,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.35,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.dialogueTutor.description',
    group: 'courses',
    id: 'soflia_dialogue_tutor',
    labelKey: 'aiSettings.purposes.dialogueTutor.label',
    legacyModelEnvVars: ['SOFLIA_DIALOGUE_MODEL', 'GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      // 4096 deja margen para los tokens de razonamiento MÁS el JSON completo de
      // la rúbrica. Bajarlo provoca JSON truncado y DIALOGUE_EVALUATION_FAILED.
      maxOutputTokens: 4_096,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.15,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.dialogueEvaluator.description',
    group: 'courses',
    id: 'soflia_dialogue_evaluator',
    labelKey: 'aiSettings.purposes.dialogueEvaluator.label',
    legacyMaxOutputTokensEnvVar: 'SOFLIA_DIALOGUE_EVALUATOR_MAX_OUTPUT_TOKENS',
    legacyModelEnvVars: ['SOFLIA_DIALOGUE_MODEL', 'GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 1_200,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.2,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.activityValidation.description',
    group: 'courses',
    id: 'activity_validation',
    labelKey: 'aiSettings.purposes.activityValidation.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 4_096,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.25,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.lessonAutoNote.description',
    group: 'courses',
    id: 'lesson_auto_note',
    labelKey: 'aiSettings.purposes.lessonAutoNote.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 4_096,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.3,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.quizFeedback.description',
    group: 'courses',
    id: 'quiz_feedback',
    labelKey: 'aiSettings.purposes.quizFeedback.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 8_192,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.25,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.courseCompendium.description',
    group: 'courses',
    id: 'course_compendium',
    labelKey: 'aiSettings.purposes.courseCompendium.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },
  {
    capabilities: {
      maxOutputTokens: false,
      temperature: true,
      thinkingLevel: true,
    },
    defaults: {
      maxOutputTokens: null,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.2,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.courseTimeEstimation.description',
    group: 'courses',
    id: 'course_time_estimation',
    labelKey: 'aiSettings.purposes.courseTimeEstimation.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },

  // ── Analítica e insights ─────────────────────────────────────────────────
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 4_000,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.2,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.reportsInsights.description',
    group: 'analytics',
    id: 'reports_analytics_insights',
    labelKey: 'aiSettings.purposes.reportsInsights.label',
    legacyModelEnvVars: ['REPORTS_ANALYTICS_GEMINI_MODEL', 'GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 3_200,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.15,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.reportsBlueprint.description',
    group: 'analytics',
    id: 'reports_analytics_blueprint',
    labelKey: 'aiSettings.purposes.reportsBlueprint.label',
    legacyMaxOutputTokensEnvVar: 'REPORTS_ANALYTICS_AI_MAX_OUTPUT_TOKENS',
    legacyModelEnvVars: ['REPORTS_ANALYTICS_GEMINI_MODEL', 'GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 1_800,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.2,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.businessUserAnalytics.description',
    group: 'analytics',
    id: 'business_user_analytics',
    labelKey: 'aiSettings.purposes.businessUserAnalytics.label',
    legacyModelEnvVars: ['REPORTS_ANALYTICS_GEMINI_MODEL', 'GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 600,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.25,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.learningPreview.description',
    group: 'analytics',
    id: 'learning_preview',
    labelKey: 'aiSettings.purposes.learningPreview.label',
    legacyModelEnvVars: ['LEARNING_PREVIEW_GEMINI_MODEL', 'GEMINI_MODEL'],
  },

  // ── Generación y tratamiento de contenido ────────────────────────────────
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      // Los modelos gemini-3.x descuentan el razonamiento de este mismo
      // presupuesto y su consumo varía por apunte (se han medido entre ~490 y
      // ~1.420 tokens de razonamiento). Con 1.024 el modelo se quedaba sin
      // espacio para el JSON, devolvía finishReason MAX_TOKENS y el
      // enriquecimiento fallaba con AI_INVALID_JSON_RESPONSE. La respuesta útil
      // ocupa ~200-300 tokens: 2.048 deja margen sin encarecer la llamada
      // (solo se paga lo generado).
      maxOutputTokens: 2_048,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.2,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.notebookEnrichment.description',
    group: 'content',
    id: 'notebook_enrichment',
    labelKey: 'aiSettings.purposes.notebookEnrichment.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 4_096,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.4,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.notebookAssistant.description',
    group: 'content',
    id: 'notebook_assistant',
    labelKey: 'aiSettings.purposes.notebookAssistant.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },
  {
    capabilities: {
      // El presupuesto se calcula por longitud del texto a traducir; fijarlo
      // truncaría traducciones largas.
      maxOutputTokens: false,
      temperature: true,
      thinkingLevel: true,
    },
    defaults: {
      maxOutputTokens: null,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.3,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.autoTranslation.description',
    group: 'content',
    id: 'auto_translation',
    labelKey: 'aiSettings.purposes.autoTranslation.label',
    legacyModelEnvVars: ['AUTO_TRANSLATION_GEMINI_MODEL'],
  },
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 10,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.1,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.languageDetection.description',
    group: 'content',
    id: 'language_detection',
    labelKey: 'aiSettings.purposes.languageDetection.label',
    legacyModelEnvVars: ['LANGUAGE_DETECTION_GEMINI_MODEL'],
  },
  {
    capabilities: {
      maxOutputTokens: false,
      temperature: false,
      thinkingLevel: true,
    },
    defaults: {
      maxOutputTokens: null,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: null,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.videoProcessing.description',
    group: 'content',
    id: 'video_processing',
    labelKey: 'aiSettings.purposes.videoProcessing.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
    // Envía el vídeo subido como contenido en línea.
    supportedProviders: GOOGLE_ONLY,
  },

  // ── Plataforma ───────────────────────────────────────────────────────────
  {
    capabilities: ALL_CAPABILITIES,
    defaults: {
      maxOutputTokens: 500,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.1,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.moderation.description',
    group: 'platform',
    id: 'ai_moderation',
    labelKey: 'aiSettings.purposes.moderation.label',
    legacyModelEnvVars: ['AI_MODERATION_GEMINI_MODEL', 'GEMINI_MODEL'],
  },
  {
    capabilities: {
      // El presupuesto no estaba fijado en el punto de llamada: un informe
      // forense se trunca si se limita sin conocer el volumen auditado.
      maxOutputTokens: false,
      temperature: true,
      thinkingLevel: true,
    },
    defaults: {
      maxOutputTokens: null,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: 0.2,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.userForensics.description',
    group: 'platform',
    id: 'user_forensics',
    labelKey: 'aiSettings.purposes.userForensics.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },
  {
    capabilities: {
      maxOutputTokens: false,
      temperature: false,
      thinkingLevel: true,
    },
    defaults: {
      maxOutputTokens: null,
      model: PLATFORM_DEFAULT_GEMINI_MODEL,
      temperature: null,
      thinkingLevel: 'default',
    },
    descriptionKey: 'aiSettings.purposes.structuredFallback.description',
    group: 'platform',
    id: 'structured_generation_fallback',
    labelKey: 'aiSettings.purposes.structuredFallback.label',
    legacyModelEnvVars: ['GEMINI_MODEL'],
  },
] as const satisfies readonly (AiModelPurposeDefinition & {
  legacyMaxOutputTokensEnvVar?: string
  legacyTemperatureEnvVar?: string
})[]

export type AiModelPurposeId = (typeof AI_MODEL_PURPOSES)[number]['id']

export type AiModelPurpose = (typeof AI_MODEL_PURPOSES)[number]

const PURPOSES_BY_ID = new Map<string, AiModelPurpose>(
  AI_MODEL_PURPOSES.map((purpose) => [purpose.id, purpose]),
)

export function isAiModelPurposeId(value: unknown): value is AiModelPurposeId {
  return typeof value === 'string' && PURPOSES_BY_ID.has(value)
}

/**
 * Devuelve la definición de un propósito conocido.
 * Lanza si el identificador no existe: llamar con un propósito desconocido es un
 * error de programación, no una condición de runtime recuperable.
 */
export function getAiModelPurpose(id: AiModelPurposeId): AiModelPurpose {
  const purpose = PURPOSES_BY_ID.get(id)
  if (!purpose) {
    throw new Error(`Propósito de IA desconocido: ${id}`)
  }

  return purpose
}

/**
 * Proveedores que pueden atender un propósito. Un propósito sin restricción
 * declarada los admite todos.
 *
 * El parámetro es la definición completa y no un `Pick` de `supportedProviders`
 * porque ese `Pick` sería un "weak type" (solo propiedades opcionales) y
 * TypeScript rechazaría los propósitos que no declaran la restricción, que son
 * justamente la mayoría.
 */
export function getPurposeSupportedProviders(
  purpose: AiModelPurposeDefinition,
): readonly AiProvider[] {
  return purpose.supportedProviders ?? AI_PROVIDERS
}

export function isProviderSupportedByPurpose(
  purpose: AiModelPurposeDefinition,
  provider: AiProvider,
): boolean {
  return getPurposeSupportedProviders(purpose).includes(provider)
}
