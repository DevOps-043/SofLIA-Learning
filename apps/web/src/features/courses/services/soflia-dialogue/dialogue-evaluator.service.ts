import {
  buildOrganizationAiContextPromptSection,
  type ResolvedOrganizationAiContext,
} from '@/lib/lia-context/services/organization-ai-context.service'
import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { selectPromptVariant, type PromptModelProfile } from '@/lib/ai/prompts'
import {
  generateAiText,
  isAiPurposeAvailable,
} from '@/lib/ai/providers/ai-text-gateway.server'
import { scaleTimeoutForReasoning } from '@/lib/ai/providers/reasoning-budget'
import type { AiProvider } from '@/lib/ai/providers/provider-registry'
import type { AiThinkingLevel } from '@/lib/ai/model-settings/thinking'
import { logger } from '@/lib/utils/logger'

import {
  dialogueEvaluationResultSchema,
  type DialogueActivityConfig,
  type DialogueEvaluationResult,
} from '../../types/dialogue-runtime'
import { normalizeDialogueEvaluationPayload } from './dialogue-evaluation.normalizer'
import { buildEvaluatorPromptForGoogle } from './dialogue-evaluator.google.prompt'
import { buildEvaluatorPromptForOpenAi } from './dialogue-evaluator.openai.prompt'
import { DialogueRuntimeError } from './dialogue-runtime.errors'
import type { DialogueEvaluationRow, DialogueTurnRow } from './dialogue-tables'

function stripJsonFence(value: string) {
  return value.trim().replace(/^```json\s*|\s*```$/g, '')
}

function extractJsonObject(value: string) {
  const stripped = stripJsonFence(value)
  const firstBrace = stripped.indexOf('{')
  const lastBrace = stripped.lastIndexOf('}')

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return stripped
  }

  return stripped.slice(firstBrace, lastBrace + 1)
}

function isLowEvidenceStudentMessage(message: string) {
  const normalized = message
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) return true

  const wordCount = normalized.split(/\s+/).filter(Boolean).length
  const explicitLowEvidence = [
    'no se',
    'no lo se',
    'nose',
    'ni idea',
    'no tengo idea',
    'no entiendo',
    'no sabria',
    'no puedo',
    'no estoy seguro',
    'no estoy segura',
  ]

  return (
    explicitLowEvidence.includes(normalized) ||
    (wordCount <= 2 && /^(no|nose|nada|ninguna|ninguno)$/.test(normalized))
  )
}

function buildLocalLowEvidenceEvaluation(
  config: DialogueActivityConfig,
): DialogueEvaluationResult {
  return {
    backendNotes: 'Respuesta evasiva o insuficiente clasificada localmente para evitar una llamada IA innecesaria.',
    criteriaMet: [],
    criteriaMissing: config.successCriteria.map((criterion) => criterion.id),
    decision: 'low_evidence',
    dimensionScores: config.rubric.map((dimension) => ({
      id: dimension.id,
      rationale: 'No hay evidencia suficiente para evaluar este criterio.',
      score: 0,
    })),
    evidenceQuotes: [],
    feedbackForTutor:
      'Todavia necesito una respuesta con mas evidencia para poder ayudarte a avanzar.',
    flags: {
      contradiction: false,
      evasiveAnswer: true,
      keywordStuffing: false,
      memorizedWithoutLogic: false,
      promptInjection: false,
    },
    overallScore: 0,
    recommendedNextState: 'HINT',
  }
}

/**
 * Modelo del evaluador.
 *
 * El modelo declarado en la propia actividad sigue teniendo la máxima
 * precedencia (es una decisión pedagógica del autor del curso); por debajo
 * manda la configuración administrada del propósito `soflia_dialogue_evaluator`.
 *
 * Devuelve `null` cuando no hay modelo en la actividad, para que el gateway
 * resuelva modelo Y proveedor desde el propósito. Devolverlo aquí resuelto
 * obligaría a deducir el proveedor dos veces y a mantener sincronizadas ambas
 * deducciones.
 */
function resolveDialogueEvaluatorModelOverride(
  config: DialogueActivityConfig,
): string | null {
  return config.evaluator.model || null
}

/**
 * Techo absoluto de espera del evaluador. Por encima, la petición choca contra
 * el límite de ejecución de la función que aloja la ruta antes que contra este
 * valor, y el estudiante recibe un error de red en vez de una calificación.
 */
const MAX_EVALUATOR_TIMEOUT_MS = 60000

function resolveDialogueEvaluationTimeoutMs(settings: {
  model: string
  provider: AiProvider
  thinkingLevel: AiThinkingLevel
}) {
  const rawTimeout = Number(process.env.SOFLIA_DIALOGUE_EVALUATOR_TIMEOUT_MS)
  const baseTimeoutMs =
    Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 25000

  // Con esfuerzo de razonamiento alto, el modelo puede pasar decenas de segundos
  // pensando antes del primer token: el tiempo base aborta la llamada a mitad de
  // razonamiento y el turno acaba en recuperación técnica.
  return scaleTimeoutForReasoning({
    baseTimeoutMs,
    maxTimeoutMs: MAX_EVALUATOR_TIMEOUT_MS,
    model: settings.model,
    provider: settings.provider,
    thinkingLevel: settings.thinkingLevel,
  })
}

/**
 * Presupuesto de salida VISIBLE del evaluador: lo que ocupa el JSON de la
 * rúbrica ya escrito.
 *
 * El margen de razonamiento NO se suma aquí. Lo añade el gateway según el modelo
 * que resuelva el propósito (ver `lib/ai/providers/reasoning-budget.ts`), que es
 * la única capa que conoce el proveedor final. Sumarlo también en este punto lo
 * contaría dos veces y volvería a atar el número a un proveedor concreto, que es
 * exactamente el acoplamiento que rompió la evaluación al pasar a OpenAI.
 */
const DEFAULT_EVALUATOR_MAX_OUTPUT_TOKENS = 4096

/**
 * Reintento de emergencia cuando la respuesta llega vacía o truncada pese al
 * margen. Duplicar el presupuesto es lo único que puede salvar ese turno: repetir
 * la llamada con el mismo número fallaría igual, de forma determinista.
 */
const TRUNCATION_RETRY_MULTIPLIER = 2

function resolveDialogueEvaluationMaxOutputTokens(
  managedMaxOutputTokens?: number | null,
) {
  const rawValue =
    managedMaxOutputTokens ??
    Number(process.env.SOFLIA_DIALOGUE_EVALUATOR_MAX_OUTPUT_TOKENS)
  if (!Number.isFinite(rawValue) || rawValue <= 0) {
    return DEFAULT_EVALUATOR_MAX_OUTPUT_TOKENS
  }

  // Se acota siempre: un presupuesto por debajo de 1024 trunca el JSON de la
  // rúbrica y hace fallar CADA turno con DIALOGUE_EVALUATION_FAILED.
  return Math.max(1024, Math.min(Math.trunc(rawValue), 8192))
}

/**
 * Error de presupuesto agotado, distinguible de un JSON inválido.
 *
 * Importa para el diagnóstico: ambos llegaban al mismo `catch` y se reportaban
 * con el mismo mensaje genérico, así que desde fuera "el modelo no cabe en su
 * presupuesto" y "el modelo escribió mal el JSON" eran indistinguibles pese a
 * necesitar arreglos opuestos.
 */
class DialogueEvaluationBudgetError extends Error {
  constructor(readonly maxOutputTokens: number, readonly modelName: string) {
    super(
      `El evaluador agoto su presupuesto de salida sin emitir texto (modelo ${modelName}, maxOutputTokens visible ${maxOutputTokens}). ` +
        'Sube el presupuesto del proposito soflia_dialogue_evaluator o baja su nivel de razonamiento.',
    )
    this.name = 'DialogueEvaluationBudgetError'
  }
}

export async function evaluateDialogueTurn(input: {
  accumulatedCriteriaMet?: string[]
  config: DialogueActivityConfig
  organizationAiContext?: ResolvedOrganizationAiContext | null
  previousEvaluations: DialogueEvaluationRow[]
  recentTurns: DialogueTurnRow[]
  studentMessage: string
}): Promise<{ evaluation: DialogueEvaluationResult; modelName: string }> {
  const evaluatorSettings = await getAiModelSettings('soflia_dialogue_evaluator')
  const modelOverride = resolveDialogueEvaluatorModelOverride(input.config)
  const modelName = modelOverride ?? evaluatorSettings.model

  if (isLowEvidenceStudentMessage(input.studentMessage)) {
    return {
      evaluation: buildLocalLowEvidenceEvaluation(input.config),
      modelName: 'local-low-evidence-classifier',
    }
  }

  if (!(await isAiPurposeAvailable('soflia_dialogue_evaluator'))) {
    throw new DialogueRuntimeError(
      'DIALOGUE_EVALUATION_FAILED',
      503,
      'La evaluacion SofLIA no esta disponible: falta la clave del proveedor de IA configurado',
    )
  }

  const visibleMaxOutputTokens = resolveDialogueEvaluationMaxOutputTokens(
    evaluatorSettings.maxOutputTokens,
  )

  async function requestEvaluation(maxOutputTokens: number) {
    const response = await generateAiText({
      circuitBreakerName: 'gemini-dialogue-evaluator',
      maxOutputTokens,
      ...(modelOverride ? { model: modelOverride } : {}),
      prompt: (profile: PromptModelProfile) =>
        selectPromptVariant(
          profile,
          {
            google: buildEvaluatorPromptForGoogle,
            openai: buildEvaluatorPromptForOpenAi,
          },
          input,
        ),
      purpose: 'soflia_dialogue_evaluator',
      // No administrable: la respuesta se parsea como JSON obligatoriamente.
      responseAsJson: true,
      systemInstruction:
        'Eres un evaluador justo de comprension conceptual: calificas ideas y razonamiento, nunca la coincidencia literal de palabras. Responde exclusivamente JSON valido.',
      timeoutMs: resolveDialogueEvaluationTimeoutMs({
        model: modelName,
        provider: evaluatorSettings.provider,
        thinkingLevel: evaluatorSettings.thinkingLevel,
      }),
    })

    // Vacío o truncado son el mismo fallo: el modelo se quedó sin presupuesto
    // (habitualmente razonando) antes de cerrar el JSON. Se distingue del JSON
    // inválido porque el arreglo es el contrario: más presupuesto, no mejor prompt.
    if (!response.text || response.truncated) {
      throw new DialogueEvaluationBudgetError(maxOutputTokens, modelName)
    }

    return response
  }

  try {
    const response = await requestEvaluation(visibleMaxOutputTokens).catch((error) => {
      if (!(error instanceof DialogueEvaluationBudgetError)) throw error

      logger.warn('SofLIA dialogue evaluator ran out of output budget; retrying larger', {
        maxOutputTokens: visibleMaxOutputTokens,
        model: modelName,
      })

      return requestEvaluation(visibleMaxOutputTokens * TRUNCATION_RETRY_MULTIPLIER)
    })

    const parsed = JSON.parse(extractJsonObject(response.text))

    return {
      // Se repara la FORMA antes de validar: el esquema es `.strict()` y una
      // clave de más o una cita demasiado larga tiraban una evaluación por lo
      // demás correcta, dejando sin acreditar respuestas válidas.
      evaluation: dialogueEvaluationResultSchema.parse(
        normalizeDialogueEvaluationPayload(parsed, input.config),
      ),
      modelName,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    // El detalle real solo existía dentro de este `catch`: fuera, todo fallo del
    // evaluador era "no fue posible evaluar" y el operador no podía distinguir
    // presupuesto agotado de credencial ausente ni de JSON inválido.
    logger.error('SofLIA dialogue evaluation failed', error, {
      isBudgetExhaustion: error instanceof DialogueEvaluationBudgetError,
      maxOutputTokens: visibleMaxOutputTokens,
      model: modelName,
      provider: evaluatorSettings.provider,
    })

    throw new DialogueRuntimeError(
      'DIALOGUE_EVALUATION_FAILED',
      502,
      'No fue posible evaluar la respuesta con SofLIA',
      { message },
    )
  }
}
