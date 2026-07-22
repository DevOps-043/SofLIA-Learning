import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

import { getAiModelSettings } from '@/lib/ai/model-settings/ai-model-settings.server.service'
import { buildManagedGenerationConfig } from '@/lib/ai/model-settings/generation-config'
import { apiError } from '@/lib/api/errors'
import { withZodBody } from '@/lib/api/with-validation'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import { loadBusinessUserLearningPaths } from '@/features/learning-paths/services/learning-path-dashboard.server'
import { LearningPathDefaultsService } from '@/features/learning-paths/services/learning-path-defaults.server'
import { learningPreviewSchema, type LearningPreviewBody } from './schema'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

interface CoursePreviewRow {
  id: string
  title: string | null
  description: string | null
  level: string | null
  duration_total_minutes: number | null
  category: string | null
  learning_objectives: unknown
}

interface LearningPathPreviewRow {
  id: string
  title: string | null
  description: string | null
}

interface PathCoursePreviewRow {
  id: string
  title: string | null
  description: string | null
}

interface CourseAccessRow {
  id: string
}

interface LearningPreviewSummaryRow {
  payload: unknown
  model_name: string | null
}

interface LearningPreviewSummaryWrite {
  kind: 'course' | 'learning_path'
  target_id: string
  locale: 'es' | 'en' | 'pt'
  model_name: string
  payload: PreviewResponsePayload
}

interface LegacyLearningPreviewCacheRow {
  payload: unknown
  model_name: string | null
  expires_at: string | null
}

interface GeminiPreviewResult {
  description: string
  points: string[]
}

type PreviewResponsePayload = GeminiPreviewResult & {
  source: 'gemini' | 'fallback' | 'cache'
  model: string
}

const GEMINI_PREVIEW_TIMEOUT_MS = 3500

function getGeminiApiKey() {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null
}

function normalizePreviewLocale(locale?: string): 'es' | 'en' | 'pt' {
  const normalized = locale?.toLowerCase().trim()

  if (normalized?.startsWith('en')) return 'en'
  if (normalized?.startsWith('pt')) return 'pt'
  return 'es'
}

function getPreviewLanguage(locale?: string) {
  const normalizedLocale = normalizePreviewLocale(locale)

  if (normalizedLocale === 'en') return 'English'
  if (normalizedLocale === 'pt') return 'Portuguese'
  return 'Spanish'
}

function sanitizeText(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function normalizePoints(points: unknown): string[] {
  if (!Array.isArray(points)) return []

  return points
    .map((point) => sanitizeText(point))
    .filter(Boolean)
    .slice(0, 3)
}

function parseGeminiPreview(raw: string | undefined): GeminiPreviewResult | null {
  if (!raw) return null

  const sanitized = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  const jsonText = sanitized.startsWith('{')
    ? sanitized
    : sanitized.match(/\{[\s\S]*\}/)?.[0]

  if (!jsonText) return null

  try {
    const parsed = JSON.parse(jsonText) as { description?: unknown; points?: unknown }
    const description = sanitizeText(parsed.description)
    const points = normalizePoints(parsed.points)

    if (!description || points.length === 0) return null

    return { description, points }
  } catch {
    return null
  }
}

function parseCachedPreview(
  payload: unknown,
  modelName?: string | null,
): PreviewResponsePayload | null {
  if (!payload || typeof payload !== 'object') return null

  const cachedPayload = payload as Partial<PreviewResponsePayload>
  const description = sanitizeText(cachedPayload.description)
  const points = normalizePoints(cachedPayload.points)

  if (!description || points.length === 0) return null

  return {
    description,
    points,
    source: 'cache',
    model:
      sanitizeText(modelName) ||
      sanitizeText(cachedPayload.model) ||
      'cache',
  }
}

function buildFallbackPreview(input: {
  kind: 'course' | 'learning_path'
  title: string
  description?: string | null
  courseTitles?: string[]
  locale?: string
}): GeminiPreviewResult {
  const isEnglish = input.locale?.startsWith('en')
  const isPortuguese = input.locale?.startsWith('pt')
  const sourceDescription = sanitizeText(input.description)

  if (isEnglish) {
    return {
      description: sourceDescription || `This ${input.kind === 'course' ? 'course' : 'learning path'} is built around ${input.title}.`,
      points: [
        'Review the main objective before starting.',
        'Advance in the recommended order to keep context.',
        'Use the activities to validate what you learned.',
      ],
    }
  }

  if (isPortuguese) {
    return {
      description: sourceDescription || `Este ${input.kind === 'course' ? 'curso' : 'learning path'} está estruturado em torno de ${input.title}.`,
      points: [
        'Revise o objetivo principal antes de começar.',
        'Avance na ordem recomendada para manter o contexto.',
        'Use as atividades para validar o aprendizado.',
      ],
    }
  }

  return {
    description: sourceDescription || `Este ${input.kind === 'course' ? 'curso' : 'learning path'} está estructurado alrededor de ${input.title}.`,
    points: [
      'Revisa el objetivo principal antes de empezar.',
      'Avanza en el orden recomendado para mantener contexto.',
      'Usa las actividades para validar lo aprendido.',
    ],
  }
}

// Cache storage is now handled directly via Supabase in getPreviewResult

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs)
  })

  const result = await Promise.race([promise, timeout])
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  return result
}

async function generatePreviewWithGemini(input: {
  kind: 'course' | 'learning_path'
  title: string
  description?: string | null
  metadata: Record<string, unknown>
  courseTitles?: string[]
  locale?: string
}) {
  const apiKey = getGeminiApiKey()
  const settings = await getAiModelSettings('learning_preview')
  const modelName = settings.model

  if (!apiKey) {
    return {
      ...buildFallbackPreview(input),
      source: 'fallback' as const,
      model: modelName,
    }
  }

  const language = getPreviewLanguage(input.locale)
  const prompt = {
    type: input.kind,
    title: input.title,
    realDescription: input.description || null,
    metadata: input.metadata,
    courseTitles: input.courseTitles || [],
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: [
        `You are SofLIA, an AI learning analyst. Respond in ${language}.`,
        'Use only the provided course or learning-path data.',
        'Prioritize the real description when present. If the description is short or missing, infer cautiously from the title and course sequence.',
        'Do not invent duration, price, ratings, instructor credentials, or unavailable content.',
        'Return only valid JSON with this exact shape: {"description":"...","points":["...","...","..."]}.',
        'description: 45-70 words, practical, clear, and user-facing.',
        'points: exactly 3 short learning outcomes or reasons to take the course/path.',
      ].join('\n'),
    })

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: JSON.stringify(prompt) }],
        },
      ],
      generationConfig: buildManagedGenerationConfig(settings, {
        // No administrable: la respuesta se parsea como JSON obligatoriamente.
        responseMimeType: 'application/json',
      }),
    })

    const parsed = parseGeminiPreview(result.response.text())
    if (parsed) {
      return {
        ...parsed,
        source: 'gemini' as const,
        model: modelName,
      }
    }
  } catch (error) {
    logger.error('Learning preview Gemini generation failed', error)
  }

  return {
    ...buildFallbackPreview(input),
    source: 'fallback' as const,
    model: `${modelName}:fallback`,
  }
}

async function getPreviewResult(input: {
  organizationId: string
  targetId: string
  kind: 'course' | 'learning_path'
  title: string
  description?: string | null
  metadata: Record<string, unknown>
  courseTitles?: string[]
  locale?: string
}): Promise<PreviewResponsePayload> {
  const supabase = createAdminClient()
  const currentLocale = normalizePreviewLocale(input.locale)
  const universalCacheTable = fromLoose<
    LearningPreviewSummaryRow,
    LearningPreviewSummaryWrite
  >(supabase, 'learning_preview_summaries')

  try {
    const { data: cached } = await universalCacheTable
      .select('payload, model_name')
      .eq('kind', input.kind)
      .eq('target_id', input.targetId)
      .eq('locale', currentLocale)
      .maybeSingle()

    if (cached) {
      const parsed = parseCachedPreview(cached.payload, cached.model_name)

      if (parsed) {
        return parsed
      }
    }
  } catch (error) {
    logger.error('Failed to read learning preview from universal cache table', error)
  }

  try {
    const { data: legacyCached } = await supabase
      .from('learning_preview_cache')
      .select('payload, model_name, expires_at')
      .eq('organization_id', input.organizationId)
      .eq('kind', input.kind)
      .eq('target_id', input.targetId)
      .eq('locale', currentLocale)
      .maybeSingle<LegacyLearningPreviewCacheRow>()

    const parsedLegacy = parseCachedPreview(
      legacyCached?.payload,
      legacyCached?.model_name,
    )

    if (parsedLegacy) {
      await universalCacheTable
        .upsert(
          {
            kind: input.kind,
            target_id: input.targetId,
            locale: currentLocale,
            model_name: parsedLegacy.model,
            payload: parsedLegacy,
          },
          { onConflict: 'kind,target_id,locale' },
        )

      return parsedLegacy
    }
  } catch (error) {
    logger.error('Failed to read learning preview from legacy cache table', error)
  }

  const { model: configuredPreviewModel } = await getAiModelSettings('learning_preview')
  const fallback = {
    ...buildFallbackPreview(input),
    source: 'fallback' as const,
    model: `${configuredPreviewModel}:timeout-fallback`,
  }

  const generated = await withTimeout(
    generatePreviewWithGemini(input),
    GEMINI_PREVIEW_TIMEOUT_MS,
  )
  const result = generated || fallback

  try {
    await universalCacheTable.upsert(
      {
        kind: input.kind,
        target_id: input.targetId,
        locale: currentLocale,
        model_name: result.model,
        payload: result,
      },
      { onConflict: 'kind,target_id,locale' },
    )
  } catch (error) {
    logger.error('Failed to write learning preview to universal cache table', error)
  }

  return result
}

async function handlePost(
  _request: NextRequest,
  body: LearningPreviewBody,
  context: RouteContext,
) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return apiError('ORG_SLUG_REQUIRED', 'Solicitud invalida', 400)
    }

    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) {
      return apiError(
        'BUSINESS_USER_ORGANIZATION_REQUIRED',
        'Sin contexto de organizacion',
        403,
      )
    }

    const supabase = createAdminClient()
    await LearningPathDefaultsService.applyDefaultRulesForUser({
      userId: auth.userId,
      organizationId: auth.organizationId,
    }).catch((err: unknown) => {
      logger.error('Error applying default learning paths for preview:', err)
    })

    const learningPaths = await loadBusinessUserLearningPaths({
      userId: auth.userId,
      organizationId: auth.organizationId,
    })

    if (body.kind === 'learning_path') {
      const assignedPath = learningPaths.find((path) => path.id === body.targetId)
      if (!assignedPath) {
        return apiError('LEARNING_PATH_NOT_ASSIGNED', 'Ruta no asignada', 404)
      }

      const { data: pathData, error } = await supabase
        .from('learning_paths')
        .select('id, title, description')
        .eq('id', body.targetId)
        .maybeSingle<LearningPathPreviewRow>()

      if (error) {
        logger.error('Learning preview path fetch failed', error)
      }

      const pathCourseIds = assignedPath.items.map((item) => item.courseId)
      const { data: pathCourses } = pathCourseIds.length > 0
        ? await supabase
            .from('courses')
            .select('id, title, description')
            .in('id', pathCourseIds)
            .returns<PathCoursePreviewRow[]>()
        : { data: [] as PathCoursePreviewRow[] }

      const result = await getPreviewResult({
        organizationId: auth.organizationId,
        targetId: body.targetId,
        kind: 'learning_path',
        title: pathData?.title || assignedPath.title,
        description: pathData?.description || assignedPath.description,
        courseTitles: assignedPath.items.map((item) => item.title),
        metadata: {
          progressPercentage: assignedPath.progressPercentage,
          completedItemsCount: assignedPath.completedItemsCount,
          totalItemsCount: assignedPath.totalItemsCount,
          courses: (pathCourses || []).map((course) => ({
            title: course.title,
            description: course.description,
          })),
        },
        locale: body.locale,
      })

      return NextResponse.json({ success: true, ...result })
    }

    const courseId = body.targetId
    const pathForCourse = learningPaths.find((path) =>
      path.items.some((item) => item.courseId === courseId),
    )
    const pathItem = pathForCourse?.items.find((item) => item.courseId === courseId)

    const { data: directAccess } = await supabase
      .from('organization_course_assignments')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .eq('user_id', auth.userId)
      .eq('course_id', courseId)
      .in('status', ['assigned', 'in_progress', 'completed'])
      .maybeSingle<CourseAccessRow>()

    if (!directAccess && !pathItem) {
      return apiError('COURSE_NOT_ASSIGNED', 'Curso no asignado', 404)
    }

    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, description, level, duration_total_minutes, category, learning_objectives')
      .eq('id', courseId)
      .maybeSingle<CoursePreviewRow>()

    if (error || !course) {
      logger.error('Learning preview course fetch failed', error)
      return apiError('COURSE_NOT_FOUND', 'Curso no encontrado', 404)
    }

    const result = await getPreviewResult({
      organizationId: auth.organizationId,
      targetId: body.targetId,
      kind: 'course',
      title: course.title || pathItem?.title || 'Curso',
      description: course.description,
      metadata: {
        level: course.level,
        durationTotalMinutes: course.duration_total_minutes,
        category: course.category,
        learningObjectives: course.learning_objectives,
        learningPathTitle: pathForCourse?.title || null,
        learningPathPosition: pathItem?.position || null,
        progress: pathItem?.progress ?? null,
        status: pathItem?.status ?? null,
      },
      locale: body.locale,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    logger.error('Learning preview endpoint failed', error)
    return apiError('LEARNING_PREVIEW_FAILED', 'Error interno', 500)
  }
}

/**
 * GET /api/[orgSlug]/business-user/learning-preview?kind=...&targetId=...&locale=...
 *
 * Fast cache-only lookup. Does NOT load learning paths or call Gemini.
 * Used as a pre-flight by the client: if this returns 200, show content immediately
 * without any "Analizando" loading state. If 204, the client falls back to POST.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { orgSlug } = await context.params
  if (!orgSlug) return new NextResponse(null, { status: 204 })

  const auth = await requireBusinessUser({ organizationSlug: orgSlug })
  if (auth instanceof NextResponse) return new NextResponse(null, { status: 204 })

  const sp = request.nextUrl.searchParams
  const kind = sp.get('kind')
  const targetId = sp.get('targetId')
  const locale = sp.get('locale') ?? undefined

  if (!kind || !targetId || (kind !== 'course' && kind !== 'learning_path')) {
    return new NextResponse(null, { status: 204 })
  }

  const currentLocale = normalizePreviewLocale(locale)
  const supabase = createAdminClient()

  try {
    const { data: cached } = await fromLoose<
      LearningPreviewSummaryRow,
      LearningPreviewSummaryWrite
    >(supabase, 'learning_preview_summaries')
      .select('payload, model_name')
      .eq('kind', kind)
      .eq('target_id', targetId)
      .eq('locale', currentLocale)
      .maybeSingle()

    if (cached) {
      const parsed = parseCachedPreview(cached.payload, cached.model_name)
      if (parsed) return NextResponse.json({ success: true, ...parsed })
    }

    // Also check legacy table so content already in the old cache is served fast
    if (auth.organizationId) {
      const { data: legacyCached } = await supabase
        .from('learning_preview_cache')
        .select('payload, model_name, expires_at')
        .eq('organization_id', auth.organizationId)
        .eq('kind', kind)
        .eq('target_id', targetId)
        .eq('locale', currentLocale)
        .maybeSingle<LegacyLearningPreviewCacheRow>()

      const parsedLegacy = parseCachedPreview(legacyCached?.payload, legacyCached?.model_name)
      if (parsedLegacy) return NextResponse.json({ success: true, ...parsedLegacy })
    }
  } catch (error) {
    logger.error('Learning preview GET cache lookup failed', error)
  }

  return new NextResponse(null, { status: 204 })
}

export const POST = withZodBody(learningPreviewSchema, handlePost)
