import { GoogleGenerativeAI } from '@google/generative-ai'
import { logger } from '@/lib/logger'
import { analyzeTimeEstimationTarget } from './courseTimeEstimation.rules'
import type {
  CourseTimeEstimationTarget,
  TimeEstimationAnalysis,
  TimeEstimationConfidence,
  TimeEstimationResult,
} from './courseTimeEstimation.types'

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp'
const AI_BATCH_SIZE = 20
const GLOBAL_MIN_MINUTES = 1
const GLOBAL_MAX_MINUTES = 480

interface GeminiReviewedItem {
  targetId?: unknown
  estimatedMinutes?: unknown
  confidence?: unknown
  rationale?: unknown
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }

  return chunks
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function getGeminiApiKey(): string | null {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null
}

function normalizeConfidence(value: unknown): TimeEstimationConfidence {
  if (value === 'high' || value === 'medium' || value === 'low') {
    return value
  }

  return 'medium'
}

function buildFallbackResult(
  analysis: TimeEstimationAnalysis,
  source: TimeEstimationResult['source'] = 'deterministic',
): TimeEstimationResult {
  return {
    targetId: analysis.target.id,
    kind: analysis.target.kind,
    lessonId: analysis.target.lessonId,
    estimatedMinutes: analysis.deterministicMinutes,
    source,
    confidence: analysis.confidence,
    rationale: analysis.rationale,
  }
}

function buildSystemPrompt(): string {
  return [
    'Eres un analista experto en tiempos estimados para contenido educativo en SofLIA Learning.',
    'Tu tarea es definir el tiempo estimado real de materiales y actividades que hoy no tienen tiempo guardado en base de datos.',
    'Reglas estrictas:',
    '- Devuelve solo JSON valido.',
    '- Cada tiempo debe ser un entero en minutos.',
    '- Decide cada tiempo desde cero usando el contenido, la complejidad cognitiva, la cantidad de pasos, la longitud del texto, las preguntas, los prompts, la evidencia requerida y el esfuerzo esperado del alumno.',
    '- heuristicMinutes y las señales incluidas son apoyo tecnico secundario. NO copies automaticamente esos valores y NO uses una plantilla fija por tipo.',
    '- Los videos ya se calculan aparte; no agregues tiempo de video.',
    '- No sobreestimes actividades ai_chat, reflexiones cortas o ejercicios breves; el tiempo debe ser razonable segun la consigna concreta.',
    '- Si el contenido es ambiguo, devuelve tu mejor estimacion profesional y usa confianza low o medium.',
    'Formato de salida:',
    '{"items":[{"targetId":"...","estimatedMinutes":6,"confidence":"medium","rationale":"motivo breve"}]}',
  ].join('\n')
}

function parsePromptList(rawPrompts: string | null | undefined): string[] {
  if (!rawPrompts) {
    return []
  }

  try {
    const parsed = JSON.parse(rawPrompts) as unknown
    if (Array.isArray(parsed)) {
      return parsed
        .map((prompt) => String(prompt).trim())
        .filter(Boolean)
    }
  } catch {
    // Ignorado: se aplica fallback a texto plano.
  }

  return rawPrompts
    .split('\n')
    .map((prompt) => prompt.trim())
    .filter(Boolean)
}

function buildUserPrompt(
  courseTitle: string,
  analyses: TimeEstimationAnalysis[],
): string {
  return JSON.stringify({
    courseTitle,
    task:
      'Define un tiempo estimado razonable por item y devuelve solo JSON valido.',
    items: analyses.map((analysis) => ({
      targetId: analysis.target.id,
      kind: analysis.target.kind,
      targetType: analysis.target.targetType,
      lessonTitle: analysis.target.lessonTitle,
      moduleTitle: analysis.target.moduleTitle,
      title: analysis.target.title,
      description: analysis.target.description,
      contentPreview: analysis.signals.plainTextExcerpt,
      promptPreview: parsePromptList(analysis.target.aiPrompts).slice(0, 5),
      heuristicMinutes: analysis.deterministicMinutes,
      heuristicConfidence: analysis.confidence,
      heuristicRationale: analysis.rationale,
      requiresSofliaValidation: Boolean(
        analysis.target.requiresSofliaValidation,
      ),
      allowedRangeMinutes: {
        min: GLOBAL_MIN_MINUTES,
        max: GLOBAL_MAX_MINUTES,
      },
      signals: analysis.signals,
    })),
  })
}

function parseGeminiResponse(rawContent: string): { items?: GeminiReviewedItem[] } {
  const trimmed = rawContent.trim()
  const sanitized = trimmed.startsWith('```')
    ? trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
    : trimmed

  return JSON.parse(sanitized) as { items?: GeminiReviewedItem[] }
}

async function reviewChunkWithGemini(
  courseTitle: string,
  analyses: TimeEstimationAnalysis[],
  userId?: string,
): Promise<Map<string, TimeEstimationResult>> {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    return new Map()
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  })

  const result = await model.generateContent([
    { text: buildSystemPrompt() },
    { text: buildUserPrompt(courseTitle, analyses) },
  ])

  logger.info('Gemini reviewed course time estimation batch', {
    courseTitle,
    model: DEFAULT_MODEL,
    targetCount: analyses.length,
    userId,
  })

  const rawContent = result.response.text()
  if (!rawContent) {
    throw new Error('Gemini returned an empty estimation payload')
  }

  const parsed = parseGeminiResponse(rawContent)
  const reviewedItems = Array.isArray(parsed.items) ? parsed.items : []
  const analysisById = new Map(analyses.map((analysis) => [analysis.target.id, analysis]))
  const results = new Map<string, TimeEstimationResult>()

  for (const item of reviewedItems) {
    if (typeof item.targetId !== 'string') {
      continue
    }

    const analysis = analysisById.get(item.targetId)
    if (!analysis) {
      continue
    }

    const candidateMinutes =
      typeof item.estimatedMinutes === 'number'
        ? item.estimatedMinutes
        : Number(item.estimatedMinutes)

    if (!Number.isFinite(candidateMinutes)) {
      continue
    }

    results.set(item.targetId, {
      targetId: analysis.target.id,
      kind: analysis.target.kind,
      lessonId: analysis.target.lessonId,
      estimatedMinutes: clamp(
        Math.round(candidateMinutes),
        GLOBAL_MIN_MINUTES,
        GLOBAL_MAX_MINUTES,
      ),
      source: 'gemini',
      confidence: normalizeConfidence(item.confidence),
      rationale:
        typeof item.rationale === 'string' && item.rationale.trim().length > 0
          ? item.rationale.trim()
          : analysis.rationale,
    })
  }

  return results
}

export class CourseTimeEstimationService {
  static analyzeTargets(
    targets: CourseTimeEstimationTarget[],
  ): TimeEstimationAnalysis[] {
    return targets.map(analyzeTimeEstimationTarget)
  }

  static async estimateTargets(
    courseTitle: string,
    targets: CourseTimeEstimationTarget[],
    userId?: string,
  ): Promise<TimeEstimationResult[]> {
    const analyses = this.analyzeTargets(targets)
    const resultsById = new Map<string, TimeEstimationResult>()

    for (const analysis of analyses) {
      resultsById.set(analysis.target.id, buildFallbackResult(analysis))
    }

    const apiKey = getGeminiApiKey()
    if (!apiKey || analyses.length === 0) {
      if (!apiKey && analyses.length > 0) {
        logger.warn(
          'Course time estimation is using deterministic fallback because Gemini API key is missing',
          { courseTitle, targetCount: analyses.length },
        )
      }

      return analyses.map((analysis) => {
        return resultsById.get(analysis.target.id) ?? buildFallbackResult(analysis)
      })
    }

    const analysisChunks = chunkArray(analyses, AI_BATCH_SIZE)

    for (const chunk of analysisChunks) {
      try {
        const reviewedChunk = await reviewChunkWithGemini(
          courseTitle,
          chunk,
          userId,
        )
        for (const [targetId, result] of reviewedChunk.entries()) {
          resultsById.set(targetId, result)
        }
      } catch (error) {
        logger.error(
          'Falling back to deterministic course time estimates after Gemini review failure',
          error,
          { courseTitle, targetCount: chunk.length, model: DEFAULT_MODEL },
        )

        for (const analysis of chunk) {
          resultsById.set(
            analysis.target.id,
            buildFallbackResult(analysis, 'gemini-fallback'),
          )
        }
      }
    }

    return analyses.map((analysis) => {
      return resultsById.get(analysis.target.id) ?? buildFallbackResult(analysis)
    })
  }
}
