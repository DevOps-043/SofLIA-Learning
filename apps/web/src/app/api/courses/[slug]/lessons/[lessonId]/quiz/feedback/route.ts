import { createHash } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'

import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { createClient } from '@/lib/supabase/server'
import type { CourseLessonContext } from '@/core/types/lia.types'
import type { Database, Json } from '@/lib/supabase/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type QuizFeedbackRequestBody = {
  activityId?: string | null
  courseContext?: CourseLessonContext | null
  materialId?: string | null
  organizationId?: string | null
  prompt?: string
}

type QuizFeedbackLiaResponse = {
  message?: {
    content?: string
  }
  response?: string
  error?: string
}

function normalizeOptionalId(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function buildPromptHash(prompt: string): string {
  return createHash('sha256').update(prompt, 'utf8').digest('hex')
}

function createQuizFeedbackAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Configuracion incompleta de Supabase para retroalimentacion de quiz.')
  }

  return createSupabaseAdminClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function buildCurrentLessonContext(courseContext?: CourseLessonContext | null) {
  if (!courseContext) {
    return undefined
  }

  return {
    contextType: courseContext.contextType,
    courseId: courseContext.courseId,
    courseSlug: courseContext.courseSlug,
    courseTitle: courseContext.courseTitle,
    courseDescription: courseContext.courseDescription,
    userRole: courseContext.userRole,
    moduleId: courseContext.moduleId,
    moduleTitle: courseContext.moduleTitle,
    lessonId: courseContext.lessonId,
    lessonTitle: courseContext.lessonTitle,
    transcript: courseContext.transcriptContent,
    summary: courseContext.summaryContent,
    description: courseContext.lessonDescription,
    durationSeconds: courseContext.durationSeconds,
    totalDurationMinutes: courseContext.totalDurationMinutes,
    currentTab: courseContext.currentTab,
    currentPage: courseContext.currentPage,
    learningProgress: courseContext.learningProgressContext,
    activities: courseContext.activitiesContext
      ? {
          totalActivities: courseContext.activitiesContext.totalActivities,
          requiredActivities: courseContext.activitiesContext.requiredActivities,
          completedActivities: courseContext.activitiesContext.completedActivities,
          pendingRequiredCount:
            courseContext.activitiesContext.pendingRequiredCount,
          pendingRequiredTitles:
            courseContext.activitiesContext.pendingRequiredTitles,
          items: courseContext.activitiesContext.activityTypes,
          currentActivityFocus:
            courseContext.activitiesContext.currentActivityFocus || undefined,
        }
      : undefined,
    materials: courseContext.materialsContext
      ? {
          totalMaterials: courseContext.materialsContext.totalMaterials,
          requiredMaterials: courseContext.materialsContext.requiredMaterials,
          items: courseContext.materialsContext.materialTypes,
        }
      : undefined,
    quiz: courseContext.quizContext,
    userBehaviorContext: courseContext.userBehaviorContext,
    difficultyDetected: courseContext.difficultyDetected,
  }
}

function buildCurrentActivityContext(courseContext?: CourseLessonContext | null) {
  const activityFocus = courseContext?.activitiesContext?.currentActivityFocus

  if (!activityFocus) {
    return undefined
  }

  return {
    title: activityFocus.title,
    type: activityFocus.type,
    description: activityFocus.description,
    prompts: activityFocus.prompts,
  }
}

async function validateLessonResource(params: {
  activityId: string | null
  lessonId: string
  materialId: string | null
  supabase: Awaited<ReturnType<typeof createClient>>
}) {
  const { activityId, lessonId, materialId, supabase } = params

  if (materialId) {
    const { data: material, error } = await supabase
      .from('lesson_materials')
      .select('material_id')
      .eq('material_id', materialId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (error || !material) {
      return false
    }
  }

  if (activityId) {
    const { data: activity, error } = await supabase
      .from('lesson_activities')
      .select('activity_id')
      .eq('activity_id', activityId)
      .eq('lesson_id', lessonId)
      .maybeSingle()

    if (error || !activity) {
      return false
    }
  }

  return true
}

async function requestSofliaFeedback(params: {
  cookieHeader: string | null
  request: NextRequest
  body: QuizFeedbackRequestBody
  courseId: string
  lessonId: string
  prompt: string
  userId: string
  organizationId: string | null
}) {
  const {
    body,
    cookieHeader,
    courseId,
    lessonId,
    organizationId,
    prompt,
    request,
    userId,
  } = params
  const courseContext = body.courseContext
  const fallbackCurrentPage =
    courseContext?.currentPage || request.nextUrl.pathname
  const activeTab =
    courseContext?.currentTab ||
    courseContext?.learningProgressContext?.currentTab

  const response = await fetch(new URL('/api/lia/chat', request.nextUrl.origin), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      context: {
        userId,
        organizationId,
        currentPage: fallbackCurrentPage,
        currentTab: activeTab,
        pageType:
          courseContext?.contextType === 'workshop'
            ? 'workshop_lesson'
            : 'course_lesson',
        currentLessonContext:
          buildCurrentLessonContext({
            ...courseContext,
            courseId: courseContext?.courseId ?? courseId,
            lessonId: courseContext?.lessonId ?? lessonId,
          }) || undefined,
        currentActivityContext: buildCurrentActivityContext(courseContext),
      },
      stream: false,
    }),
  })

  const payload = (await response.json()) as QuizFeedbackLiaResponse

  if (!response.ok) {
    throw new Error(payload.error || 'No fue posible generar la retroalimentacion.')
  }

  const feedbackContent = payload.message?.content || payload.response

  if (!feedbackContent) {
    throw new Error('SofLIA no devolvio retroalimentacion.')
  }

  return feedbackContent
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> },
) {
  try {
    const { slug, lessonId } = await params
    const supabase = await createClient()
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = (await request.json()) as QuizFeedbackRequestBody
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''

    if (!prompt) {
      return NextResponse.json(
        { error: 'Se requiere prompt para generar retroalimentacion.' },
        { status: 400 },
      )
    }

    if (prompt.length > 12000) {
      return NextResponse.json(
        { error: 'El prompt de retroalimentacion es demasiado largo.' },
        { status: 413 },
      )
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (courseError || !course) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('lesson_id, course_modules!inner(course_id)')
      .eq('lesson_id', lessonId)
      .eq('course_modules.course_id', course.id)
      .maybeSingle()

    if (lessonError || !lesson) {
      return NextResponse.json({ error: 'Leccion no encontrada' }, { status: 404 })
    }

    const requestedOrganizationId = normalizeOptionalId(body.organizationId)
    const enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      course.id,
      requestedOrganizationId,
    )

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estas inscrito en este curso' },
        { status: 403 },
      )
    }

    const materialId = normalizeOptionalId(body.materialId)
    const activityId = normalizeOptionalId(body.activityId)
    const hasValidResource = await validateLessonResource({
      activityId,
      lessonId,
      materialId,
      supabase,
    })

    if (!hasValidResource) {
      return NextResponse.json(
        { error: 'El recurso del quiz no pertenece a esta leccion.' },
        { status: 400 },
      )
    }

    const promptHash = buildPromptHash(prompt)
    const supabaseAdmin = createQuizFeedbackAdminClient()
    const { data: cachedFeedback, error: cacheReadError } = await supabaseAdmin
      .from('quiz_feedback_cache')
      .select('feedback_id, feedback_content, created_at, updated_at')
      .eq('user_id', currentUser.id)
      .eq('lesson_id', lessonId)
      .eq('prompt_hash', promptHash)
      .maybeSingle()

    if (cacheReadError) {
      console.error('[QuizFeedback] Error leyendo cache:', cacheReadError)
      return NextResponse.json(
        { error: 'Error al consultar retroalimentacion guardada.' },
        { status: 500 },
      )
    }

    if (cachedFeedback) {
      return NextResponse.json({
        feedback: {
          content: cachedFeedback.feedback_content,
          createdAt: cachedFeedback.created_at,
          id: cachedFeedback.feedback_id,
          promptHash,
          updatedAt: cachedFeedback.updated_at,
        },
        source: 'cache',
      })
    }

    const feedbackContent = await requestSofliaFeedback({
      body,
      cookieHeader: request.headers.get('cookie'),
      courseId: course.id,
      lessonId,
      organizationId: enrollment.organization_id || requestedOrganizationId,
      prompt,
      request,
      userId: currentUser.id,
    })
    const now = new Date().toISOString()

    const { data: storedFeedback, error: insertError } = await supabaseAdmin
      .from('quiz_feedback_cache')
      .upsert(
        {
          activity_id: activityId,
          course_id: course.id,
          enrollment_id: enrollment.enrollment_id,
          feedback_content: feedbackContent,
          lesson_id: lessonId,
          material_id: materialId,
          metadata: {
            source: 'quiz_feedback_panel',
            slug,
          } satisfies Json,
          organization_id: enrollment.organization_id || requestedOrganizationId,
          prompt_hash: promptHash,
          prompt_text: prompt,
          source_model: process.env.CHATBOT_MODEL || 'gpt-4o-mini',
          updated_at: now,
          user_id: currentUser.id,
        },
        { onConflict: 'user_id,lesson_id,prompt_hash' },
      )
      .select('feedback_id, feedback_content, created_at, updated_at')
      .single()

    if (insertError || !storedFeedback) {
      console.error('[QuizFeedback] Error guardando cache:', insertError)
      return NextResponse.json(
        { error: 'La retroalimentacion se genero, pero no pudo guardarse.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      feedback: {
        content: storedFeedback.feedback_content,
        createdAt: storedFeedback.created_at,
        id: storedFeedback.feedback_id,
        promptHash,
        updatedAt: storedFeedback.updated_at,
      },
      source: 'generated',
    })
  } catch (error) {
    console.error('[QuizFeedback] Error inesperado:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Error interno al generar retroalimentacion.',
      },
      { status: 500 },
    )
  }
}
