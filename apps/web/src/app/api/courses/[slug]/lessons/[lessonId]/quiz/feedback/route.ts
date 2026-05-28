import { createHash } from 'crypto'

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

const QUIZ_FEEDBACK_SYSTEM_INSTRUCTION = `Eres SofLIA, la asistente de aprendizaje de SofLIA Learning. Estás revisando las respuestas incorrectas de un quiz.

Tu objetivo: retroalimentación concisa, directa y útil que aclare el concepto correcto.

Reglas estrictas:
- NO incluyas saludos, presentaciones ni frases introductorias. Ve directo a la retroalimentación.
- Máximo 2-3 oraciones por pregunta incorrecta
- Confirma la respuesta correcta y explica brevemente por qué es correcta
- Explica de forma directa por qué la respuesta del alumno es incorrecta
- Cita minutos del video solo si aparecen explícitamente en la transcripción proporcionada
- Tono: empático, directo y profesional
- Idioma: español
- Formato: párrafos fluidos, sin listas ni viñetas
- No inventes información que no esté en el material de la lección`

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

async function generateFeedbackWithGemini(params: {
  prompt: string
  courseContext?: CourseLessonContext | null
}): Promise<string> {
  const googleApiKey = process.env.GOOGLE_API_KEY
  if (!googleApiKey) {
    throw new Error('GOOGLE_API_KEY no está configurada.')
  }

  let systemInstruction = QUIZ_FEEDBACK_SYSTEM_INSTRUCTION

  const transcript = params.courseContext?.transcriptContent
  if (transcript) {
    const excerpt = transcript.slice(0, 3000)
    systemInstruction += `\n\nTranscripción del video de esta lección (úsala para citar minutos exactos si los menciona):\n${excerpt}`
  }

  const genAI = new GoogleGenerativeAI(googleApiKey)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
    systemInstruction,
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.3,
    },
  })

  const result = await model.generateContent(params.prompt)
  const content = result.response.text()

  if (!content) {
    throw new Error('SofLIA no devolvió retroalimentación.')
  }

  return content
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

    // Phase 1: course lookup + cache check in parallel
    const promptHash = buildPromptHash(prompt)
    const supabaseAdmin = createQuizFeedbackAdminClient()

    const [courseResult, cacheResult] = await Promise.all([
      supabase.from('courses').select('id').eq('slug', slug).maybeSingle(),
      supabaseAdmin
        .from('quiz_feedback_cache')
        .select('feedback_id, feedback_content, created_at, updated_at')
        .eq('user_id', currentUser.id)
        .eq('lesson_id', lessonId)
        .eq('prompt_hash', promptHash)
        .maybeSingle(),
    ])

    if (courseResult.error || !courseResult.data) {
      return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
    }

    if (cacheResult.error) {
      console.error('[QuizFeedback] Error leyendo cache:', cacheResult.error)
      return NextResponse.json(
        { error: 'Error al consultar retroalimentacion guardada.' },
        { status: 500 },
      )
    }

    if (cacheResult.data) {
      return NextResponse.json({
        feedback: {
          content: cacheResult.data.feedback_content,
          createdAt: cacheResult.data.created_at,
          id: cacheResult.data.feedback_id,
          promptHash,
          updatedAt: cacheResult.data.updated_at,
        },
        source: 'cache',
      })
    }

    const course = courseResult.data
    const requestedOrganizationId = normalizeOptionalId(body.organizationId)
    const materialId = normalizeOptionalId(body.materialId)
    const activityId = normalizeOptionalId(body.activityId)

    // Phase 2: lesson lookup + enrollment in parallel
    const [lessonResult, enrollment] = await Promise.all([
      supabase
        .from('course_lessons')
        .select('lesson_id, course_modules!inner(course_id)')
        .eq('lesson_id', lessonId)
        .eq('course_modules.course_id', course.id)
        .maybeSingle(),
      resolveCourseEnrollment(supabase, currentUser.id, course.id, requestedOrganizationId),
    ])

    if (lessonResult.error || !lessonResult.data) {
      return NextResponse.json({ error: 'Leccion no encontrada' }, { status: 404 })
    }

    if (!enrollment) {
      return NextResponse.json(
        { error: 'No estas inscrito en este curso' },
        { status: 403 },
      )
    }

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

    const feedbackContent = await generateFeedbackWithGemini({
      prompt,
      courseContext: body.courseContext,
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
          source_model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
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
