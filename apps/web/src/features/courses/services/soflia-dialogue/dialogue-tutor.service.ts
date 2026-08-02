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

import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
  DialoguePolicyDecision,
} from '../../types/dialogue-runtime'
import type { DialogueTurnRow } from './dialogue-tables'
import { buildTutorPromptForGoogle } from './dialogue-tutor.google.prompt'
import { buildTutorPromptForOpenAi } from './dialogue-tutor.openai.prompt'

function getFirstMissingCriterion(input: {
  config: DialogueActivityConfig
  evaluation: DialogueEvaluationResult
}) {
  const missingId = input.evaluation.criteriaMissing[0]
  if (!missingId) return null

  return (
    input.config.successCriteria.find((criterion) => criterion.id === missingId) ||
    null
  )
}

function ensureCompleteSentence(content: string) {
  const trimmed = content.trim()
  if (!trimmed) return ''

  return /[.!?)]$/.test(trimmed) ? trimmed : `${trimmed}.`
}

/** Comparison key tolerant to case, accents, punctuation and spacing noise. */
function normalizeForRepetition(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿¡?!.,;:"“”'‘’()[\]-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitIntoSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

/**
 * Fragment containment (a candidate buried inside a longer previous message)
 * only counts as a repeat above this length: below it, phrases are too
 * generic and over-matching would mutilate legitimate messages. Exact
 * full-sentence repeats are filtered at ANY length (see wasAlreadySaid), so
 * short repeated questions like "¿Que opinas?" are still caught.
 */
const MIN_FRAGMENT_REPETITION_LENGTH = 18

/** Precomputed lookup over previous assistant turns for repetition checks. */
interface RepetitionIndex {
  normalizedContents: string[]
  normalizedSentences: Set<string>
}

function buildRepetitionIndex(
  previousAssistantContents: string[],
): RepetitionIndex {
  return {
    normalizedContents: previousAssistantContents
      .map(normalizeForRepetition)
      .filter(Boolean),
    normalizedSentences: new Set(
      previousAssistantContents
        .flatMap(splitIntoSentences)
        .map(normalizeForRepetition)
        .filter(Boolean),
    ),
  }
}

function wasAlreadySaid(content: string, index: RepetitionIndex) {
  const normalized = normalizeForRepetition(content)
  if (!normalized) return false

  // Exact repeat of a full sentence SofLIA already said — any length.
  if (index.normalizedSentences.has(normalized)) return true

  if (normalized.length < MIN_FRAGMENT_REPETITION_LENGTH) return false
  return index.normalizedContents.some((previous) =>
    previous.includes(normalized),
  )
}

/**
 * Removes sentences that repeat (verbatim or as a fragment) something SofLIA
 * already said in previous turns. This is the display-boundary guard against
 * the "previous questions bleed into the current question" bug: neither the
 * evaluator feedback nor the tutor model output is trusted to be repeat-free.
 */
export function stripRepeatedTutorContent(
  candidate: string,
  previousAssistantContents: string[],
): string {
  if (previousAssistantContents.length === 0) return candidate.trim()

  const index = buildRepetitionIndex(previousAssistantContents)

  return splitIntoSentences(candidate)
    .filter((sentence) => !wasAlreadySaid(sentence, index))
    .join(' ')
    .trim()
}

/**
 * Picks the probe question for a CHALLENGE_OR_PROBE turn, skipping challenge
 * prompts already asked in this session so the student never sees the same
 * question re-appended turn after turn (root cause of the repeated-questions
 * report: previously this always used challengePrompts[0]).
 */
export function selectDialogueProbe(input: {
  config: DialogueActivityConfig
  evaluation: DialogueEvaluationResult
  previousAssistantContents: string[]
}) {
  const index = buildRepetitionIndex(input.previousAssistantContents)

  const unusedChallengePrompt = input.config.challengePrompts
    .map((prompt) => prompt.trim())
    .find(
      (prompt) =>
        prompt &&
        !isLikelyIncompleteTutorMessage(prompt) &&
        !wasAlreadySaid(prompt, index),
    )
  if (unusedChallengePrompt) {
    return ensureCompleteSentence(unusedChallengePrompt)
  }

  const criterion = getFirstMissingCriterion(input)
  const criterionProbe = criterion
    ? `Para avanzar, aterriza ${criterion.label}: explica que decision concreta tomarias, por que y que consecuencia esperas en este escenario.`
    : ''
  const genericProbe =
    'Para avanzar, conecta tu idea con una decision concreta, su razon y su consecuencia dentro del escenario.'

  return (
    [criterionProbe, genericProbe].find(
      (probe) => probe && !wasAlreadySaid(probe, index),
    ) ||
    criterionProbe ||
    genericProbe
  )
}

function normalizeStudentFacingFeedback(content: string) {
  const normalized = content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .replace(/^el estudiante debe\s+/i, '')
    .replace(/^debes\s+/i, '')
    .replace(/^debe\s+/i, '')
    .trim()

  if (!normalized || isLikelyIncompleteTutorMessage(normalized)) {
    return ''
  }

  return ensureCompleteSentence(normalized)
}

function fallbackTutorMessage(input: {
  config: DialogueActivityConfig
  evaluation: DialogueEvaluationResult
  policy: DialoguePolicyDecision
  previousAssistantContents: string[]
}) {
  const { config, evaluation, policy, previousAssistantContents } = input

  if (policy.nextState === 'COMPLETE') {
    return 'Tu respuesta cubre los criterios clave y muestra razonamiento suficiente. Cierro la actividad con retroalimentacion final.'
  }

  if (policy.nextState === 'FAIL_OR_RETRY') {
    return 'Aun no hay evidencia suficiente para acreditar esta actividad. Revisa el enfoque y vuelve a intentarlo cuando estes listo.'
  }

  if (policy.nextState === 'SESSION_SUMMARY') {
    return 'La actividad se cierra por ahora. Revisa la retroalimentacion final antes de continuar.'
  }

  if (policy.nextState === 'RESCUE') {
    return `Modelo de referencia: ${ensureCompleteSentence(config.rescueContent)} Si quieres reforzar la idea, vuelve al video de la leccion y retomalo desde ahi antes de continuar.`
  }

  if (policy.nextState === 'HINT' && policy.hintToUse) {
    return ensureCompleteSentence(policy.hintToUse.content)
  }

  // The evaluator feedback may quote SofLIA's previous question back; strip
  // anything already said before composing, so past questions never resurface.
  const feedback = stripRepeatedTutorContent(
    normalizeStudentFacingFeedback(evaluation.feedbackForTutor),
    previousAssistantContents,
  )
  const probe = selectDialogueProbe({
    config,
    evaluation,
    previousAssistantContents,
  })

  if (!feedback) {
    return probe
  }

  if (feedback.toLocaleLowerCase().includes(probe.toLocaleLowerCase())) {
    return feedback
  }

  return `${feedback} ${probe}`
}

function clampTutorMaxOutputTokens(rawValue: number): number {
  if (!Number.isFinite(rawValue)) {
    return 1600
  }

  return Math.max(1100, Math.min(Math.trunc(rawValue), 3200))
}

/**
 * Presupuesto de salida del tutor.
 *
 * Precedencia: override administrado del propósito `soflia_dialogue_tutor` →
 * variable de entorno legacy → derivación a partir del número máximo de frases
 * de la actividad. Sea cual sea el origen, el valor se acota al rango seguro:
 * por debajo del mínimo el mensaje llega cortado a media frase.
 */
export function resolveDialogueTutorMaxOutputTokens(
  config: DialogueActivityConfig,
  managedMaxOutputTokens?: number | null,
) {
  if (managedMaxOutputTokens) {
    return clampTutorMaxOutputTokens(managedMaxOutputTokens)
  }

  const envValue = Number(process.env.SOFLIA_DIALOGUE_TUTOR_MAX_OUTPUT_TOKENS)
  if (Number.isFinite(envValue) && envValue > 0) {
    return clampTutorMaxOutputTokens(envValue)
  }

  return clampTutorMaxOutputTokens(config.tutor.maxResponseSentences * 180)
}

export function isLikelyIncompleteTutorMessage(content: string) {
  const trimmed = content.trim()
  if (!trimmed) return true
  if (trimmed.endsWith('...')) return true
  if (/[,;:]$/.test(trimmed)) return true
  if (/\b(y|e|o|u|pero|porque|para|por|con|de|del|a|al|en|entre|sobre|hacia|hasta|desde|que|si|cuando|aunque|and|or|but|because|for|with|of|to|in|on|the|a|an|ou|mas|pois|com|do|da|dos|das|no|na|nos|nas)$/i.test(trimmed)) {
    return true
  }
  if (/\b(?:a|con|de|desde|en|entre|hacia|hasta|para|por|sobre|to|with|of|from|in|on|for|about|em|com|do|da)\s+(?:el|la|los|las|un|una|unos|unas|the|a|an|o|os|as|um|uma)$/i.test(trimmed)) {
    return true
  }

  const finalCharacter = trimmed.at(-1) || ''
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length
  return wordCount >= 12 && !/[.!?)]/.test(finalCharacter)
}

export function normalizeTutorMessageForDisplay(
  content: string,
  fallbackMessage: string,
) {
  const normalized = content.replace(/\n{3,}/g, '\n\n').trim()
  return isLikelyIncompleteTutorMessage(normalized)
    ? fallbackMessage
    : normalized
}

function resolveDialogueTutorTimeoutMs() {
  const rawTimeout = Number(process.env.SOFLIA_DIALOGUE_TUTOR_TIMEOUT_MS)
  return Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 8000
}

/**
 * El tutor genera sus mensajes con Gemini por defecto: es la única forma de que
 * adapte ejemplos y preguntas al cargo del estudiante y a la realidad de su
 * empresa (ver `buildTutorPrompt`). Antes estaba apagado por defecto y todo el
 * alumnado recibía las mismas plantillas literales.
 *
 * `SOFLIA_DIALOGUE_TUTOR_USE_MODEL=false` queda como interruptor de emergencia
 * para volver a las plantillas sin desplegar (incidencia de cuota, latencia o
 * calidad). Cualquier otro valor —o su ausencia— mantiene el modelo activo.
 */
function shouldUseDialogueTutorModel() {
  const rawValue = process.env.SOFLIA_DIALOGUE_TUTOR_USE_MODEL
  if (!rawValue) return true

  return !['0', 'false', 'no'].includes(rawValue.trim().toLowerCase())
}

export async function generateDialogueTutorMessage(input: {
  config: DialogueActivityConfig
  evaluation: DialogueEvaluationResult
  organizationAiContext?: ResolvedOrganizationAiContext | null
  policy: DialoguePolicyDecision
  recentTurns: DialogueTurnRow[]
}) {
  const previousAssistantContents = input.recentTurns
    .filter((turn) => turn.role === 'assistant')
    .map((turn) => turn.content)
  const fallbackInput = { ...input, previousAssistantContents }

  if (
    input.policy.nextState === 'COMPLETE' ||
    input.policy.nextState === 'FAIL_OR_RETRY' ||
    input.policy.nextState === 'SESSION_SUMMARY'
  ) {
    return fallbackTutorMessage(fallbackInput)
  }

  const fallbackMessage = fallbackTutorMessage(fallbackInput)

  if (!shouldUseDialogueTutorModel()) {
    return fallbackMessage
  }

  if (!(await isAiPurposeAvailable('soflia_dialogue_tutor'))) {
    return fallbackMessage
  }

  try {
    // Propósito `soflia_dialogue_tutor`: modelo, proveedor y parámetros
    // independientes de SofLIA general, administrables desde el panel de
    // superadmin. Solo el presupuesto de tokens se calcula aquí, porque depende
    // del número máximo de frases que declare la rúbrica de la actividad.
    const settings = await getAiModelSettings('soflia_dialogue_tutor')

    const response = await generateAiText({
      circuitBreakerName: 'gemini-dialogue-tutor',
      maxOutputTokens: resolveDialogueTutorMaxOutputTokens(
        input.config,
        settings.maxOutputTokens,
      ),
      prompt: (profile: PromptModelProfile) =>
        selectPromptVariant(
          profile,
          {
            google: buildTutorPromptForGoogle,
            openai: buildTutorPromptForOpenAi,
          },
          input,
        ),
      purpose: 'soflia_dialogue_tutor',
      systemInstruction:
        'Eres SofLIA. Genera solo el mensaje visible para el estudiante, sin JSON ni instrucciones internas.',
      timeoutMs: resolveDialogueTutorTimeoutMs(),
    })

    const normalized = normalizeTutorMessageForDisplay(
      response.text,
      fallbackMessage,
    )
    if (normalized === fallbackMessage) {
      return fallbackMessage
    }

    // Display-boundary guard: even with the prompt rule, the model can echo a
    // previous question; strip repeats and fall back if nothing usable remains.
    const withoutRepeats = stripRepeatedTutorContent(
      normalized,
      previousAssistantContents,
    )
    return !withoutRepeats || isLikelyIncompleteTutorMessage(withoutRepeats)
      ? fallbackMessage
      : withoutRepeats
  } catch {
    return fallbackMessage
  }
}
