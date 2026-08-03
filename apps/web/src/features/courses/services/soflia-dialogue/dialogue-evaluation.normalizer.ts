import type { DialogueActivityConfig } from '../../types/dialogue-runtime'

/**
 * Normalizador de la respuesta cruda del evaluador ANTES de validarla con Zod.
 *
 * POR QUÉ EXISTE: `dialogueEvaluationResultSchema` es `.strict()` y se aplicaba
 * con `.parse()` directo sobre lo que devolvía el modelo. Con ese contrato,
 * cualquier desviación cosmética —una clave de más, una cita de evidencia de 401
 * caracteres, un `overallScore` como cadena— no degradaba la evaluación: la
 * DESTRUÍA. El turno terminaba en `DIALOGUE_EVALUATION_FAILED` y el estudiante
 * recibía un mensaje de recuperación técnica en lugar de su calificación, con su
 * respuesta correcta sin acreditar.
 *
 * Un modelo generativo no es una API con contrato: acertar el esquema al
 * carácter es una probabilidad, no una garantía, y esa probabilidad cambia al
 * cambiar de modelo desde el panel. La forma se REPARA aquí y se valida después;
 * el esquema sigue siendo la última palabra sobre lo que entra al dominio.
 *
 * LÍMITE DELIBERADO: se repara la FORMA, nunca el FONDO. No se inventan
 * criterios cumplidos, no se reescala la nota y no se convierte un suspenso en
 * un aprobado. Si el modelo dice 40, aquí sale 40.
 *
 * Módulo puro: sin IO ni dependencias del servidor, para poder probarlo entero.
 */

/** Longitudes máximas del esquema. Recortar es preferible a rechazar. */
const MAX_LENGTHS = {
  criterionId: 100,
  evidenceQuote: 400,
  notes: 1200,
  rationale: 800,
} as const

const VALID_DECISIONS = [
  'complete',
  'partial_continue',
  'needs_hint',
  'low_evidence',
  'rescue',
  'fail_or_retry',
  'security_block',
] as const

const VALID_NEXT_STATES = [
  'START',
  'ELICIT_RESPONSE',
  'EVALUATE_RESPONSE',
  'CHALLENGE_OR_PROBE',
  'HINT',
  'RESCUE',
  'COMPLETE',
  'FAIL_OR_RETRY',
  'SESSION_SUMMARY',
] as const

const FLAG_KEYS = [
  'keywordStuffing',
  'promptInjection',
  'evasiveAnswer',
  'contradiction',
  'memorizedWithoutLogic',
] as const

/**
 * Envoltorios que los modelos añaden cuando se les pide "responde JSON": el
 * objeto útil viene anidado bajo una clave descriptiva. Desenvolverlo cuesta una
 * comprobación y evita perder una evaluación entera por un nivel de anidamiento.
 */
const KNOWN_WRAPPER_KEYS = ['evaluation', 'evaluacion', 'result', 'resultado', 'output']

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function unwrap(payload: Record<string, unknown>): Record<string, unknown> {
  if ('overallScore' in payload || 'decision' in payload) return payload

  for (const key of KNOWN_WRAPPER_KEYS) {
    const nested = payload[key]
    if (isPlainObject(nested)) return nested
  }

  return payload
}

/**
 * Nota en la escala 0-100. NO reescala: un 1 puede ser legítimamente 1/100 y
 * "corregirlo" a 100 aprobaría a quien no debía aprobar. Solo convierte cadenas
 * numéricas y recorta al rango válido.
 */
function toScore(value: unknown): number {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : value
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return 0

  return Math.min(100, Math.max(0, parsed))
}

function toText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()

  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength).trim()
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is string => typeof item === 'string')
}

/**
 * Índice de resolución de criterios: por ID exacto, por ID sin distinguir
 * mayúsculas y por etiqueta visible.
 *
 * MOTIVO: la política compara criterios por ID (`allRequiredCriteriaMet`). Un
 * modelo que devuelve la etiqueta legible —"Define el objetivo del mensaje"— en
 * lugar del ID hace que NINGÚN criterio obligatorio cuente como cubierto, y el
 * estudiante no aprueba nunca por muy correcta que sea su respuesta. Traducir la
 * etiqueta a su ID no relaja la exigencia: identifica el mismo criterio.
 */
function buildCriterionIndex(config: DialogueActivityConfig): Map<string, string> {
  const index = new Map<string, string>()

  for (const criterion of config.successCriteria) {
    index.set(criterion.id, criterion.id)
    index.set(criterion.id.toLowerCase(), criterion.id)
    if (criterion.label) {
      index.set(criterion.label.trim().toLowerCase(), criterion.id)
    }
  }

  return index
}

/**
 * Traduce a IDs reales de la actividad y descarta lo que no corresponda a
 * ningún criterio: un ID inventado no puede cumplirse ni faltar.
 */
function resolveCriterionIds(value: unknown, index: Map<string, string>): string[] {
  const resolved = toStringArray(value)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .map((raw) => index.get(raw) ?? index.get(raw.toLowerCase()) ?? null)
    .filter((id): id is string => id !== null)

  return [...new Set(resolved)]
}

function normalizeFlags(value: unknown): Record<string, boolean> {
  const source = isPlainObject(value) ? value : {}

  return Object.fromEntries(FLAG_KEYS.map((key) => [key, source[key] === true]))
}

function normalizeDimensionScores(value: unknown): unknown[] {
  if (!Array.isArray(value)) return []

  return value.filter(isPlainObject).flatMap((entry) => {
    const id = toText(entry.id, MAX_LENGTHS.criterionId)
    if (!id) return []

    return [{ id, rationale: toText(entry.rationale, MAX_LENGTHS.rationale), score: toScore(entry.score) }]
  })
}

function normalizeEvidenceQuotes(value: unknown): string[] {
  return toStringArray(value)
    .map((quote) => toText(quote, MAX_LENGTHS.evidenceQuote))
    .filter(Boolean)
}

function normalizeDecision(value: unknown): string {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : ''

  return (VALID_DECISIONS as readonly string[]).includes(normalized)
    ? normalized
    : 'partial_continue'
}

function normalizeNextState(value: unknown): string {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : ''

  return (VALID_NEXT_STATES as readonly string[]).includes(normalized)
    ? normalized
    : 'CHALLENGE_OR_PROBE'
}

/**
 * Devuelve un objeto con EXACTAMENTE las claves del esquema, listo para
 * `dialogueEvaluationResultSchema.parse()`. Al construirlo desde cero, cualquier
 * clave extra del modelo se descarta sin que `.strict()` llegue a verla.
 */
export function normalizeDialogueEvaluationPayload(
  raw: unknown,
  config: DialogueActivityConfig,
): Record<string, unknown> {
  const payload = unwrap(isPlainObject(raw) ? raw : {})
  const criterionIndex = buildCriterionIndex(config)
  const criteriaMet = resolveCriterionIds(payload.criteriaMet, criterionIndex)
  const criteriaMissing = resolveCriterionIds(payload.criteriaMissing, criterionIndex).filter(
    // Un criterio no puede estar cumplido y faltando a la vez; ante la
    // contradicción manda `criteriaMet`, que es lo que el modelo afirma haber
    // encontrado como evidencia.
    (id) => !criteriaMet.includes(id),
  )

  return {
    backendNotes: toText(payload.backendNotes, MAX_LENGTHS.notes),
    criteriaMet,
    criteriaMissing,
    decision: normalizeDecision(payload.decision),
    dimensionScores: normalizeDimensionScores(payload.dimensionScores),
    evidenceQuotes: normalizeEvidenceQuotes(payload.evidenceQuotes),
    feedbackForTutor: toText(payload.feedbackForTutor, MAX_LENGTHS.notes),
    flags: normalizeFlags(payload.flags),
    overallScore: toScore(payload.overallScore),
    recommendedNextState: normalizeNextState(payload.recommendedNextState),
  }
}
