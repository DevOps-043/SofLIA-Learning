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

import {
  dialogueEvaluationResultSchema,
  type DialogueActivityConfig,
  type DialogueEvaluationResult,
} from '../../types/dialogue-runtime'
import { buildEvaluatorPromptForGoogle } from './dialogue-evaluator.google.prompt'
import { buildEvaluatorPromptForOpenAi } from './dialogue-evaluator.openai.prompt'
import { DialogueRuntimeError } from './dialogue-runtime.errors'
import type { DialogueEvaluationRow, DialogueTurnRow } from './dialogue-tables'

function stringify(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

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

function resolveDialogueEvaluationTimeoutMs() {
  const rawTimeout = Number(process.env.SOFLIA_DIALOGUE_EVALUATOR_TIMEOUT_MS)
  return Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 25000
}

/**
 * Presupuesto de salida del evaluador. Los modelos con razonamiento interno (familia
 * gemini-3.x) descuentan sus "thinking tokens" de maxOutputTokens: con un presupuesto
 * corto el JSON llega truncado o vacío y CADA turno falla con DIALOGUE_EVALUATION_FAILED
 * (el origen del bucle de recuperación técnica). 4096 deja margen para razonamiento +
 * el JSON completo de la rúbrica.
 */
const DEFAULT_EVALUATOR_MAX_OUTPUT_TOKENS = 4096

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

  try {
    const response = await generateAiText({
      circuitBreakerName: 'gemini-dialogue-evaluator',
      maxOutputTokens: resolveDialogueEvaluationMaxOutputTokens(
        evaluatorSettings.maxOutputTokens,
      ),
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
      timeoutMs: resolveDialogueEvaluationTimeoutMs(),
    })

    if (!response.text) {
      // No degradar a '{}': una respuesta vacía casi siempre significa presupuesto de
      // salida agotado (thinking tokens) y debe diagnosticarse como tal, no como JSON invalido.
      throw new Error(
        `El evaluador devolvio una respuesta vacia (modelo ${modelName}); posible maxOutputTokens insuficiente`,
      )
    }

    const parsed = JSON.parse(extractJsonObject(response.text))

    return {
      evaluation: dialogueEvaluationResultSchema.parse(parsed),
      modelName,
    }
  } catch (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_EVALUATION_FAILED',
      502,
      'No fue posible evaluar la respuesta con SofLIA',
      {
        message: error instanceof Error ? error.message : String(error),
      },
    )
  }
}
