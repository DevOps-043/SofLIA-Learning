import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { loadBusinessUserLearningPaths } from '@/features/learning-paths/services/learning-path-dashboard.server'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

interface PreviewRequestBody {
  kind?: 'course' | 'learning_path'
  targetId?: string
  locale?: string
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

interface GeminiPreviewResult {
  description: string
  points: string[]
}

type PreviewResponsePayload = GeminiPreviewResult & {
  source: 'gemini' | 'fallback' | 'cache'
  model: string
}

const PREVIEW_CACHE_TTL_MS = 1000 * 60 * 60 * 6
const GEMINI_PREVIEW_TIMEOUT_MS = 3500
const MAX_PREVIEW_CACHE_ENTRIES = 500
const previewCache = new Map<string, { expiresAt: number; payload: PreviewResponsePayload }>()

function getGeminiApiKey() {
  return process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null
}

function getPreviewLanguage(locale?: string) {
  if (locale?.startsWith('en')) return 'English'
  if (locale?.startsWith('pt')) return 'Portuguese'
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

function getPreviewCacheKey(input: {
  userId: string
  organizationId: string
  kind: 'course' | 'learning_path'
  targetId: string
  locale?: string
}) {
  return [
    input.organizationId,
    input.userId,
    input.kind,
    input.targetId,
    input.locale || 'es',
  ].join(':')
}

function getCachedPreview(cacheKey: string): PreviewResponsePayload | null {
  const cached = previewCache.get(cacheKey)
  if (!cached) return null

  if (cached.expiresAt <= Date.now()) {
    previewCache.delete(cacheKey)
    return null
  }

  return {
    ...cached.payload,
    source: 'cache',
  }
}

function setCachedPreview(cacheKey: string, payload: PreviewResponsePayload) {
  if (previewCache.size >= MAX_PREVIEW_CACHE_ENTRIES) {
    const oldestKey = previewCache.keys().next().value
    if (oldestKey) {
      previewCache.delete(oldestKey)
    }
  }

  previewCache.set(cacheKey, {
    payload,
    expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS,
  })
}

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
  const modelName = process.env.LEARNING_PREVIEW_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash'

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
      generationConfig: {
        temperature: 0.25,
        maxOutputTokens: 600,
        responseMimeType: 'application/json',
      },
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
  cacheKey: string
  kind: 'course' | 'learning_path'
  title: string
  description?: string | null
  metadata: Record<string, unknown>
  courseTitles?: string[]
  locale?: string
}): Promise<PreviewResponsePayload> {
  const cached = getCachedPreview(input.cacheKey)
  if (cached) {
    return cached
  }

  const fallback = {
    ...buildFallbackPreview(input),
    source: 'fallback' as const,
    model: `${process.env.LEARNING_PREVIEW_GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash'}:timeout-fallback`,
  }

  const generated = await withTimeout(
    generatePreviewWithGemini(input),
    GEMINI_PREVIEW_TIMEOUT_MS,
  )
  const result = generated || fallback

  setCachedPreview(input.cacheKey, result)
  return result
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { orgSlug } = await context.params
    const body = (await request.json()) as PreviewRequestBody

    if (!orgSlug || !body.kind || !body.targetId) {
      return NextResponse.json({ success: false, error: 'Solicitud invalida' }, { status: 400 })
    }

    if (body.kind !== 'course' && body.kind !== 'learning_path') {
      return NextResponse.json({ success: false, error: 'Tipo de preview invalido' }, { status: 400 })
    }

    const auth = await requireBusinessUser({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth
    if (!auth.userId || !auth.organizationId) {
      return NextResponse.json({ success: false, error: 'Sin contexto de organizacion' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const learningPaths = await loadBusinessUserLearningPaths({
      userId: auth.userId,
      organizationId: auth.organizationId,
    })

    if (body.kind === 'learning_path') {
      const assignedPath = learningPaths.find((path) => path.id === body.targetId)
      if (!assignedPath) {
        return NextResponse.json({ success: false, error: 'Ruta no asignada' }, { status: 404 })
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
        cacheKey: getPreviewCacheKey({
          userId: auth.userId,
          organizationId: auth.organizationId,
          kind: body.kind,
          targetId: body.targetId,
          locale: body.locale,
        }),
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
      return NextResponse.json({ success: false, error: 'Curso no asignado' }, { status: 404 })
    }

    const { data: course, error } = await supabase
      .from('courses')
      .select('id, title, description, level, duration_total_minutes, category, learning_objectives')
      .eq('id', courseId)
      .maybeSingle<CoursePreviewRow>()

    if (error || !course) {
      logger.error('Learning preview course fetch failed', error)
      return NextResponse.json({ success: false, error: 'Curso no encontrado' }, { status: 404 })
    }

    const result = await getPreviewResult({
      cacheKey: getPreviewCacheKey({
        userId: auth.userId,
        organizationId: auth.organizationId,
        kind: body.kind,
        targetId: body.targetId,
        locale: body.locale,
      }),
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
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
