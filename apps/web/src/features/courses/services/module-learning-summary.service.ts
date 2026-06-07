import { convertNoteMarkdownToHtml } from '@/core/components/NotesModal/shared/notes-markdown-to-html.service'
import { generateGeminiText, resolveGeminiModel } from '@/lib/gemini/client'
import { logger } from '@/lib/logger'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/supabase/types'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>
type ModuleLearningSummaryRow =
  Database['public']['Tables']['module_learning_summaries']['Row']

export type ModuleLearningSummaryGenerationType =
  | 'default'
  | 'manual_regeneration'

export const MODULE_LEARNING_SUMMARY_MAX_VERSIONS = 4
export const MODULE_LEARNING_SUMMARY_PROMPT_VERSION =
  'module-learning-summary-v2'

const MODULE_LEARNING_SUMMARY_SELECT_FIELDS =
  'summary_id, user_id, course_id, module_id, organization_id, version, title, content_html, content_markdown, status, generation_type, source_snapshot, model_provider, model_name, prompt_version, error_message, generated_at, created_at, updated_at, processing_started_at, processing_finished_at, retry_count, next_retry_at, locked_until, locked_by, last_error_code'
const MODULE_LEARNING_SUMMARY_MAX_RETRIES = 3
const MODULE_LEARNING_SUMMARY_LOCK_MS = 10 * 60 * 1000
const processingSummaryIds = new Set<string>()

interface CreateModuleLearningSummaryParams {
  courseId: string
  generationType: ModuleLearningSummaryGenerationType
  moduleId: string
  organizationId?: string | null
  userId: string
}

interface EnsureDefaultSummaryParams {
  courseId: string
  moduleId: string
  organizationId?: string | null
  supabase: SupabaseServerClient
  userId: string
}

interface ProcessPendingSummariesParams {
  limit?: number
  workerId?: string
}

interface LessonSourceRow {
  lesson_id: string
  lesson_title: string | null
  lesson_description: string | null
  lesson_order_index: number | null
  summary_content: string | null
  transcript_content: string | null
}

function truncateText(value: string | null | undefined, maxLength: number) {
  if (!value) {
    return ''
  }

  const normalized = value.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength)}...`
    : normalized
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null
}

function buildSummaryTitle(moduleTitle: string | null, version: number) {
  const baseTitle = moduleTitle?.trim() || 'Modulo'
  return version === 1
    ? `Apunte SofLIA: ${baseTitle}`
    : `Apunte SofLIA: ${baseTitle} v${version}`
}

async function loadModuleTitle(
  supabase: SupabaseServerClient,
  courseId: string,
  moduleId: string,
) {
  const { data: module, error } = await supabase
    .from('course_modules')
    .select('module_title')
    .eq('module_id', moduleId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (error || !module) {
    throw new Error('Modulo no encontrado para este curso.')
  }

  return module.module_title || null
}

function getSummaryPublicFields(summary: ModuleLearningSummaryRow) {
  return {
    summary_id: summary.summary_id,
    user_id: summary.user_id,
    course_id: summary.course_id,
    module_id: summary.module_id,
    organization_id: summary.organization_id,
    version: summary.version,
    title: summary.title,
    content_html: summary.content_html,
    content_markdown: summary.content_markdown,
    status: summary.status,
    generation_type: summary.generation_type,
    model_provider: summary.model_provider,
    model_name: summary.model_name,
    prompt_version: summary.prompt_version,
    error_message:
      summary.status === 'failed'
        ? 'No fue posible generar este apunte. Intenta regenerarlo mas tarde.'
        : null,
    generated_at: summary.generated_at,
    created_at: summary.created_at,
    updated_at: summary.updated_at,
  }
}

function buildWorkerId(prefix = 'module-learning-summary') {
  const randomPart = Math.random().toString(36).slice(2, 10)
  return `${prefix}-${Date.now()}-${randomPart}`
}

function getRetryDelayMs(retryCount: number) {
  const retryDelays = [2, 5, 15].map((minutes) => minutes * 60 * 1000)
  return retryDelays[Math.min(retryCount, retryDelays.length - 1)]
}

function getErrorCode(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('GEMINI_API_KEY')) {
      return 'missing_gemini_api_key'
    }

    if (error.message.toLowerCase().includes('rate')) {
      return 'rate_limit'
    }

    return error.name || 'generation_error'
  }

  return 'unknown_error'
}

function isUniqueConstraintError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  return 'code' in error && (error as { code?: string }).code === '23505'
}

function applyLockedByFilter<TQuery extends {
  eq(column: 'locked_by', value: string): TQuery
  is(column: 'locked_by', value: null): TQuery
}>(query: TQuery, lockedBy: string | null): TQuery {
  return lockedBy === null
    ? query.is('locked_by', null)
    : query.eq('locked_by', lockedBy)
}

async function loadModuleLessons(
  supabase: SupabaseServerClient,
  courseId: string,
  moduleId: string,
) {
  const { data: module, error: moduleError } = await supabase
    .from('course_modules')
    .select('module_id, module_title, module_description, course_id')
    .eq('module_id', moduleId)
    .eq('course_id', courseId)
    .maybeSingle()

  if (moduleError || !module) {
    throw new Error('Modulo no encontrado para este curso.')
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select(
      'lesson_id, lesson_title, lesson_description, lesson_order_index, summary_content, transcript_content',
    )
    .eq('module_id', moduleId)
    .eq('is_published', true)
    .order('lesson_order_index', { ascending: true })

  if (lessonsError) {
    throw new Error(`Error al leer lecciones del modulo: ${lessonsError.message}`)
  }

  return {
    module,
    lessons: (lessons || []) as LessonSourceRow[],
  }
}

async function buildSourceContext(params: {
  courseId: string
  moduleId: string
  organizationId?: string | null
  supabase: SupabaseServerClient
  userId: string
}) {
  const { courseId, moduleId, organizationId, supabase, userId } = params
  const { module, lessons } = await loadModuleLessons(supabase, courseId, moduleId)
  const lessonIds = lessons.map((lesson) => lesson.lesson_id)

  const [
    progressResult,
    quizResult,
    quizFeedbackResult,
    notesResult,
    conversationsResult,
    activitySubmissionsResult,
  ] = await Promise.all([
    lessonIds.length
      ? supabase
          .from('user_lesson_progress')
          .select(
            'lesson_id, is_completed, lesson_status, video_progress_percentage, quiz_progress_percentage, quiz_passed, completed_at',
          )
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
      : Promise.resolve({ data: [], error: null }),
    lessonIds.length
      ? supabase
          .from('user_quiz_submissions')
          .select(
            'submission_id, lesson_id, material_id, activity_id, score, total_points, percentage_score, is_passed, completed_at, updated_at',
          )
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
          .order('completed_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    lessonIds.length
      ? supabase
          .from('quiz_feedback_cache')
          .select(
            'feedback_id, lesson_id, prompt_hash, feedback_content, created_at, updated_at',
          )
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
          .order('updated_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    lessonIds.length
      ? supabase
          .from('user_lesson_notes')
          .select('note_id, lesson_id, note_title, note_content, updated_at')
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
          .order('updated_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from('lia_conversations')
      .select('conversation_id, lesson_id, module_id, started_at, updated_at')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .or(
        `module_id.eq.${moduleId}${
          lessonIds.length ? `,lesson_id.in.(${lessonIds.join(',')})` : ''
        }`,
      )
      .order('updated_at', { ascending: false })
      .limit(20),
    lessonIds.length
      ? supabase
          .from('user_activity_submissions')
          .select(
            'submission_id, activity_id, lesson_id, status, response_text, submitted_at, updated_at',
          )
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .in('lesson_id', lessonIds)
          .order('updated_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [], error: null }),
  ])

  const conversationIds = (conversationsResult.data || []).map(
    (conversation) => conversation.conversation_id,
  )
  const messagesResult = conversationIds.length
    ? await supabase
        .from('lia_messages')
        .select('message_id, conversation_id, role, content, created_at')
        .in('conversation_id', conversationIds)
        .order('message_sequence', { ascending: true })
        .limit(200)
    : { data: [], error: null }

  const activitySubmissionIds = (activitySubmissionsResult.data || []).map(
    (submission) => submission.submission_id,
  )
  const activityEvaluationsResult = activitySubmissionIds.length
    ? await supabase
        .from('user_activity_evaluations')
        .select(
          'evaluation_id, submission_id, result_status, feedback_payload, created_at',
        )
        .in('submission_id', activitySubmissionIds)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [], error: null }

  const sourceSnapshot = {
    schemaVersion: 1,
    generatedFrom: {
      lessonIds,
      progressIds: (progressResult.data || []).map((row) => row.lesson_id),
      quizSubmissionIds: (quizResult.data || []).map((row) => row.submission_id),
      quizFeedbackIds: (quizFeedbackResult.data || []).map(
        (row) => row.feedback_id,
      ),
      manualNoteIds: (notesResult.data || []).map((row) => row.note_id),
      conversationIds,
      activitySubmissionIds,
      activityEvaluationIds: (activityEvaluationsResult.data || []).map(
        (row) => row.evaluation_id,
      ),
    },
    organizationId: organizationId || null,
  }

  const lessonsContext = lessons
    .map((lesson, index) => {
      const progress = (progressResult.data || []).find(
        (row) => row.lesson_id === lesson.lesson_id,
      )
      return [
        `${index + 1}. ${lesson.lesson_title || 'Leccion sin titulo'}`,
        `Descripcion: ${truncateText(lesson.lesson_description, 1000) || 'Sin descripcion'}`,
        `Progreso: ${progress?.is_completed ? 'completada' : 'no completada'}; video ${progress?.video_progress_percentage ?? 0}%; quiz ${progress?.quiz_progress_percentage ?? 0}%; aprobado ${progress?.quiz_passed ? 'si' : 'no'}.`,
        `Resumen: ${truncateText(lesson.summary_content, 3000) || 'No disponible'}`,
        `Transcripcion: ${truncateText(lesson.transcript_content, 3500) || 'No disponible'}`,
      ].join('\n')
    })
    .join('\n\n')

  const quizContext = (quizResult.data || [])
    .map(
      (quiz) =>
        `Leccion ${quiz.lesson_id}: ${quiz.percentage_score ?? 0}% (${quiz.is_passed ? 'aprobado' : 'no aprobado'}), score ${quiz.score ?? 0}/${quiz.total_points ?? 0}.`,
    )
    .join('\n')

  const quizFeedbackContext = (quizFeedbackResult.data || [])
    .map(
      (feedback) =>
        `Feedback quiz ${feedback.lesson_id}: ${truncateText(feedback.feedback_content, 2500)}`,
    )
    .join('\n\n')

  const notesContext = (notesResult.data || [])
    .map(
      (note) =>
        `Nota "${note.note_title}": ${truncateText(note.note_content, 1500)}`,
    )
    .join('\n')

  const chatContext = (messagesResult.data || [])
    .filter((message) => !message.content.includes('[[BUG_REPORT'))
    .map(
      (message) =>
        `${message.role}: ${truncateText(message.content, 1200)}`,
    )
    .join('\n')

  const activityContext = (activitySubmissionsResult.data || [])
    .map((submission) => {
      const evaluations = (activityEvaluationsResult.data || []).filter(
        (evaluation) => evaluation.submission_id === submission.submission_id,
      )
      return [
        `Actividad ${submission.activity_id} (${submission.status})`,
        `Respuesta: ${truncateText(submission.response_text, 1500) || 'Sin texto'}`,
        ...evaluations.map((evaluation) => {
          const feedback = readRecord(evaluation.feedback_payload)
          return `Evaluacion ${evaluation.result_status}: ${truncateText(JSON.stringify(feedback || {}), 1800)}`
        }),
      ].join('\n')
    })
    .join('\n\n')

  return {
    context: [
      `Curso: ${courseId}`,
      `Modulo: ${module.module_title || moduleId}`,
      `Descripcion del modulo: ${truncateText(module.module_description, 1600) || 'Sin descripcion'}`,
      '\n## Lecciones\n',
      lessonsContext || 'Sin lecciones disponibles.',
      '\n## Quizzes\n',
      quizContext || 'Sin intentos de quiz registrados.',
      '\n## Retroalimentacion de quizzes\n',
      quizFeedbackContext || 'Sin retroalimentacion registrada.',
      '\n## Conversaciones SofLIA\n',
      chatContext || 'Sin conversaciones vinculadas al modulo.',
      '\n## Actividades\n',
      activityContext || 'Sin actividades registradas.',
      '\n## Notas manuales del usuario\n',
      notesContext || 'Sin notas manuales.',
    ].join('\n'),
    moduleTitle: module.module_title || null,
    sourceSnapshot: sourceSnapshot as Json,
  }
}

function buildPrompt(sourceContext: string) {
  return [
    'Eres SofLIA, tutora experta en aprendizaje corporativo.',
    'Genera un apunte de aprendizaje personalizado, profundo y util para el usuario al finalizar un modulo.',
    'No copies conversaciones completas ni respuestas textuales sensibles; sintetiza patrones, evidencias y recomendaciones.',
    'El documento debe servir como apunte de estudio, evidencia de avance y guia de seguimiento personal.',
    'Usa Markdown claro, con explicaciones desarrolladas. No entregues un resumen ejecutivo breve.',
    'Extiende los puntos importantes con contexto, ejemplos y conexiones entre lecciones.',
    'Si hay poca informacion en una fuente, usa las fuentes disponibles y explica la ausencia sin inventar datos.',
    'Longitud objetivo: entre 1200 y 1800 palabras cuando el modulo tenga varias lecciones o feedback suficiente.',
    'Cada seccion principal debe tener al menos 2 parrafos o bullets desarrollados, excepto cuando no haya datos.',
    '',
    'Estructura obligatoria:',
    '## Sintesis profunda del modulo',
    '- Explica el hilo conductor del modulo, no solo una lista de temas.',
    '- Conecta las lecciones entre si y describe por que importan para el trabajo o aprendizaje del usuario.',
    '',
    '## Recorrido por leccion',
    '- Para cada leccion disponible, resume los conceptos centrales, la habilidad practicada y una aplicacion concreta.',
    '- Incluye detalles especificos de transcripciones, resumenes o materiales cuando existan.',
    '',
    '## Evidencias de avance del usuario',
    '- Integra progreso, quizzes, actividades y conversaciones SofLIA.',
    '- Describe que parece dominar el usuario y que evidencia lo respalda.',
    '',
    '## Retroalimentacion SofLIA y oportunidades de mejora',
    '- Sintetiza feedback de quizzes y conversaciones sin copiar datos sensibles completos.',
    '- Convierte errores, dudas o patrones detectados en explicaciones accionables.',
    '',
    '## Conceptos clave para conservar',
    '- Desarrolla cada concepto con definicion, utilidad y ejemplo breve.',
    '- Evita bullets de una sola linea salvo que el concepto sea menor.',
    '',
    '## Apunte practico para aplicar',
    '- Incluye plantillas, mini-checklists, preguntas de reflexion o pasos concretos que el usuario pueda reutilizar.',
    '',
    '## Recomendaciones de repaso priorizadas',
    '- Ordena de mayor a menor impacto.',
    '- Si hay referencias a lecciones o momentos concretos, incluyelas.',
    '',
    '## Proximos pasos',
    '- Propone acciones realistas para la siguiente semana y como medir avance.',
    '',
    'Fuente de datos:',
    sourceContext,
  ].join('\n')
}

async function generateSummaryMarkdown(sourceContext: string) {
  const model = resolveGeminiModel(
    process.env.MODULE_LEARNING_SUMMARY_MODEL,
    'gemini-3.5-flash',
  )
  const result = await generateGeminiText({
    circuitBreakerName: 'gemini-module-learning-summary',
    generationConfig: {
      maxOutputTokens: 4500,
      temperature: 0.45,
    },
    model,
    prompt: buildPrompt(sourceContext),
    systemInstruction:
      'Responde solo con el contenido Markdown del apunte. No incluyas notas internas.',
  })

  const content = result.text.trim()
  if (!content) {
    throw new Error('Gemini no devolvio contenido para el apunte.')
  }

  return {
    markdown: content,
    model,
  }
}

export class ModuleLearningSummaryLimitError extends Error {
  constructor() {
    super('Ya alcanzaste el limite de 4 apuntes para este modulo.')
    this.name = 'ModuleLearningSummaryLimitError'
  }
}

export class ModuleLearningSummaryService {
  static toPublicSummary(summary: ModuleLearningSummaryRow) {
    return getSummaryPublicFields(summary)
  }

  static async listSummaries(
    userId: string,
    courseId: string,
    moduleId: string,
  ) {
    const supabase = await createClient()
    return this.listSummariesWithClient(supabase, userId, courseId, moduleId)
  }

  static async listSummariesWithClient(
    supabase: SupabaseServerClient,
    userId: string,
    courseId: string,
    moduleId: string,
  ) {
    const { data, error } = await supabase
      .from('module_learning_summaries')
      .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .order('version', { ascending: false })

    if (error) {
      throw new Error(`Error al obtener apuntes del modulo: ${error.message}`)
    }

    return ((data || []) as ModuleLearningSummaryRow[]).map((summary) =>
      this.toPublicSummary(summary),
    )
  }

  static async listCourseSummaries(
    userId: string,
    courseId: string,
    moduleIds?: string[],
  ) {
    const supabase = await createClient()
    return this.listCourseSummariesWithClient(supabase, userId, courseId, moduleIds)
  }

  static async listCourseSummariesWithClient(
    supabase: SupabaseServerClient,
    userId: string,
    courseId: string,
    moduleIds?: string[],
  ) {
    let query = supabase
      .from('module_learning_summaries')
      .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .order('module_id', { ascending: true })
      .order('version', { ascending: false })

    if (moduleIds && moduleIds.length > 0) {
      query = query.in('module_id', moduleIds)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error al obtener apuntes del curso: ${error.message}`)
    }

    return ((data || []) as ModuleLearningSummaryRow[]).map((summary) =>
      this.toPublicSummary(summary),
    )
  }

  static async createSummary({
    courseId,
    generationType,
    moduleId,
    organizationId,
    userId,
  }: CreateModuleLearningSummaryParams) {
    const supabase = createAdminClient()
    const summary = await this.createSummaryWithClient(supabase, {
      courseId,
      generationType,
      moduleId,
      organizationId,
      userId,
    })

    if (summary?.status === 'generating') {
      this.triggerSummaryGeneration(summary.summary_id)
    }

    return summary
  }

  static async createSummaryWithClient(
    supabase: SupabaseServerClient,
    {
      courseId,
      generationType,
      moduleId,
      organizationId,
      userId,
    }: CreateModuleLearningSummaryParams,
  ) {
    const { data: existingRows, error: existingError } = await supabase
      .from('module_learning_summaries')
      .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .order('version', { ascending: false })

    if (existingError) {
      throw new Error(`Error al verificar apuntes existentes: ${existingError.message}`)
    }

    if (generationType === 'default' && (existingRows || []).length > 0) {
      const latest = existingRows?.[0]
      return latest ? this.toPublicSummary(latest as ModuleLearningSummaryRow) : null
    }

    const processingSummary = (existingRows || []).find(
      (row) => row.status === 'generating',
    )

    if (processingSummary) {
      return this.toPublicSummary(processingSummary as ModuleLearningSummaryRow)
    }

    const nextVersion =
      (existingRows || []).reduce(
        (maxVersion, row) => Math.max(maxVersion, row.version || 0),
        0,
      ) + 1

    if (nextVersion > MODULE_LEARNING_SUMMARY_MAX_VERSIONS) {
      throw new ModuleLearningSummaryLimitError()
    }

    const moduleTitle = await loadModuleTitle(supabase, courseId, moduleId)
    const title = buildSummaryTitle(moduleTitle, nextVersion)
    const { data: inserted, error: insertError } = await supabase
      .from('module_learning_summaries')
      .insert({
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        organization_id: organizationId || null,
        version: nextVersion,
        title,
        status: 'generating',
        generation_type: generationType,
        source_snapshot: { schemaVersion: 1, generatedFrom: null } as Json,
        model_provider: 'gemini',
        prompt_version: MODULE_LEARNING_SUMMARY_PROMPT_VERSION,
      })
      .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
      .single()

    if (insertError || !inserted) {
      if (isUniqueConstraintError(insertError)) {
        const { data: latest, error: latestError } = await supabase
          .from('module_learning_summaries')
          .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('module_id', moduleId)
          .order('version', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!latestError && latest) {
          return this.toPublicSummary(latest as ModuleLearningSummaryRow)
        }
      }

      throw new Error(`Error al crear apunte del modulo: ${insertError?.message}`)
    }

    return this.toPublicSummary(inserted as ModuleLearningSummaryRow)
  }

  static triggerSummaryGeneration(summaryId: string) {
    if (processingSummaryIds.has(summaryId)) {
      return
    }

    processingSummaryIds.add(summaryId)
    void this.processSummary(summaryId, buildWorkerId('request')).catch((error) => {
      logger.error('Error procesando apunte de aprendizaje en background:', error)
    }).finally(() => {
      processingSummaryIds.delete(summaryId)
    })
  }

  private static async claimSummaryForProcessing(
    supabase: ReturnType<typeof createAdminClient>,
    params: {
      summaryId?: string
      workerId: string
    },
  ) {
    const now = new Date()
    const nowIso = now.toISOString()
    const lockUntilIso = new Date(
      now.getTime() + MODULE_LEARNING_SUMMARY_LOCK_MS,
    ).toISOString()

    let query = supabase
      .from('module_learning_summaries')
      .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
      .eq('status', 'generating')
      .lte('next_retry_at', nowIso)
      .lt('retry_count', MODULE_LEARNING_SUMMARY_MAX_RETRIES)
      .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
      .order('created_at', { ascending: true })
      .limit(10)

    if (params.summaryId) {
      query = query.eq('summary_id', params.summaryId)
    }

    const { data: candidates, error } = await query

    if (error) {
      throw new Error(`Error buscando apuntes pendientes: ${error.message}`)
    }

    for (const candidate of (candidates || []) as ModuleLearningSummaryRow[]) {
      const { data: claimed, error: claimError } = await supabase
        .from('module_learning_summaries')
        .update({
          locked_by: params.workerId,
          locked_until: lockUntilIso,
          processing_started_at: nowIso,
          updated_at: nowIso,
        })
        .eq('summary_id', candidate.summary_id)
        .eq('status', 'generating')
        .lte('next_retry_at', nowIso)
        .lt('retry_count', MODULE_LEARNING_SUMMARY_MAX_RETRIES)
        .or(`locked_until.is.null,locked_until.lt.${nowIso}`)
        .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
        .maybeSingle()

      if (claimError) {
        logger.warn('Error reclamando apunte de aprendizaje:', {
          summaryId: candidate.summary_id,
          error: claimError.message,
        })
        continue
      }

      if (claimed) {
        return claimed as ModuleLearningSummaryRow
      }
    }

    return null
  }

  private static async processClaimedSummary(
    supabase: ReturnType<typeof createAdminClient>,
    summaryRow: ModuleLearningSummaryRow,
  ) {
    try {
      const { context, sourceSnapshot } = await buildSourceContext({
        courseId: summaryRow.course_id,
        moduleId: summaryRow.module_id,
        organizationId: summaryRow.organization_id,
        supabase,
        userId: summaryRow.user_id,
      })
      const { markdown, model } = await generateSummaryMarkdown(context)
      const contentHtml = convertNoteMarkdownToHtml(markdown)
      const now = new Date().toISOString()
      const updateSummaryQuery = supabase
        .from('module_learning_summaries')
        .update({
          content_html: contentHtml,
          content_markdown: markdown,
          status: 'ready',
          model_name: model,
          source_snapshot: sourceSnapshot,
          error_message: null,
          last_error_code: null,
          locked_by: null,
          locked_until: null,
          processing_finished_at: now,
          generated_at: now,
          updated_at: now,
        })
        .eq('summary_id', summaryRow.summary_id)
        .eq('status', 'generating')

      const { data: updated, error: updateError } = await applyLockedByFilter(
        updateSummaryQuery,
        summaryRow.locked_by,
      )
        .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
        .maybeSingle()

      if (updateError || !updated) {
        const { data: latest } = await supabase
          .from('module_learning_summaries')
          .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
          .eq('summary_id', summaryRow.summary_id)
          .maybeSingle()

        if (latest) {
          return this.toPublicSummary(latest as ModuleLearningSummaryRow)
        }

        throw new Error(`Error al guardar apunte generado: ${updateError?.message}`)
      }

      return this.toPublicSummary(updated as ModuleLearningSummaryRow)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desconocido generando apunte.'
      const nextRetryCount = (summaryRow.retry_count || 0) + 1
      const shouldFail = nextRetryCount >= MODULE_LEARNING_SUMMARY_MAX_RETRIES
      const now = new Date()
      const nextRetryAt = shouldFail
        ? null
        : new Date(now.getTime() + getRetryDelayMs(nextRetryCount - 1)).toISOString()
      const failSummaryQuery = supabase
        .from('module_learning_summaries')
        .update({
          status: shouldFail ? 'failed' : 'generating',
          error_message: errorMessage,
          last_error_code: getErrorCode(error),
          retry_count: nextRetryCount,
          next_retry_at: nextRetryAt || now.toISOString(),
          locked_by: null,
          locked_until: null,
          processing_finished_at: shouldFail ? now.toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('summary_id', summaryRow.summary_id)
        .eq('status', 'generating')

      const { data: failed } = await applyLockedByFilter(
        failSummaryQuery,
        summaryRow.locked_by,
      )
        .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
        .maybeSingle()

      return this.toPublicSummary((failed || summaryRow) as ModuleLearningSummaryRow)
    }
  }

  static async processSummary(summaryId: string, workerId = buildWorkerId('direct')) {
    const supabase = createAdminClient()
    const claimedSummary = await this.claimSummaryForProcessing(supabase, {
      summaryId,
      workerId,
    })

    if (!claimedSummary) {
      const { data: latest, error } = await supabase
        .from('module_learning_summaries')
        .select(MODULE_LEARNING_SUMMARY_SELECT_FIELDS)
        .eq('summary_id', summaryId)
        .maybeSingle()

      if (error || !latest) {
        throw new Error(`Apunte no encontrado para procesar: ${error?.message}`)
      }

      return this.toPublicSummary(latest as ModuleLearningSummaryRow)
    }

    return this.processClaimedSummary(supabase, claimedSummary)
  }

  static async processPendingSummaries({
    limit = 3,
    workerId = buildWorkerId('cron'),
  }: ProcessPendingSummariesParams = {}) {
    const supabase = createAdminClient()
    const details: Array<{
      summaryId: string
      status: string
      version: number
    }> = []
    let processed = 0
    let failed = 0

    for (let index = 0; index < limit; index += 1) {
      const claimedSummary = await this.claimSummaryForProcessing(supabase, {
        workerId,
      })

      if (!claimedSummary) {
        break
      }

      const result = await this.processClaimedSummary(supabase, claimedSummary)
      processed += 1

      if (result.status === 'failed') {
        failed += 1
      }

      details.push({
        summaryId: result.summary_id,
        status: result.status,
        version: result.version,
      })
    }

    return {
      processed,
      failed,
      details,
      workerId,
    }
  }

  static async ensureDefaultSummaryForCompletedModule({
    courseId,
    moduleId,
    organizationId,
    supabase,
    userId,
  }: EnsureDefaultSummaryParams) {
    const { lessons } = await loadModuleLessons(supabase, courseId, moduleId)
    const lessonIds = lessons.map((lesson) => lesson.lesson_id)

    if (lessonIds.length === 0) {
      return null
    }

    const { data: progressRows } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id, is_completed')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds)

    const completedLessonIds = new Set(
      (progressRows || [])
        .filter((progress) => progress.is_completed)
        .map((progress) => progress.lesson_id),
    )

    if (!lessonIds.every((lessonId) => completedLessonIds.has(lessonId))) {
      return null
    }

    const { data: existing } = await supabase
      .from('module_learning_summaries')
      .select('summary_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('module_id', moduleId)
      .limit(1)

    if (existing && existing.length > 0) {
      return existing[0]
    }

    const summary = await this.createSummaryWithClient(createAdminClient(), {
      courseId,
      generationType: 'default',
      moduleId,
      organizationId,
      userId,
    })

    if (summary?.status === 'generating') {
      this.triggerSummaryGeneration(summary.summary_id)
    }

    return summary
  }
}
