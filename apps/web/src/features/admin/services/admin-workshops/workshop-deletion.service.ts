import { fromLoose } from '@/lib/supabase/looseQuery'
import type { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type LooseQueryError = {
  message: string
  code?: string
  details?: string
}

type DeleteOperationResult = PromiseLike<{
  error: LooseQueryError | null
}>

type TableDeleteOptions = {
  label?: string
  ignoreMissingRelation?: boolean
}

type TableSelectOptions = {
  ignoreMissingRelation?: boolean
}

type CourseHierarchyIds = {
  moduleIds: string[]
  lessonIds: string[]
  materialIds: string[]
  activityIds: string[]
  teamIds: string[]
  certificateIds: string[]
  conversationIds: string[]
  questionIds: string[]
  responseIds: string[]
}

const RELATION_NOT_FOUND_CODE = '42P01'
const SCHEMA_CACHE_RELATION_NOT_FOUND_CODE = 'PGRST205'
const FOREIGN_KEY_VIOLATION_CODE = '23503'

export class WorkshopDeletionError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode = 500, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'WorkshopDeletionError'
    this.statusCode = statusCode
  }
}

export async function deleteWorkshopHierarchy(
  supabase: SupabaseClient,
  workshopId: string,
): Promise<void> {
  const {
    moduleIds,
    lessonIds,
    materialIds,
    activityIds,
    teamIds,
    certificateIds,
    conversationIds,
    questionIds,
    responseIds,
  } = await collectCourseHierarchyIds(supabase, workshopId)

  await deleteContentTranslations(supabase, 'material', materialIds)
  await deleteContentTranslations(supabase, 'activity', activityIds)
  await deleteContentTranslations(supabase, 'lesson', lessonIds)
  await deleteContentTranslations(supabase, 'module', moduleIds)
  await deleteContentTranslations(supabase, 'course', [workshopId])

  await deleteByIn(
    supabase,
    'certificate_ledger',
    'cert_id',
    certificateIds,
    {
      label: 'el historial de certificados del taller',
      ignoreMissingRelation: true,
    },
  )

  await deleteOptionalByIn(supabase, 'lia_user_feedback', 'conversation_id', conversationIds, {
    label: 'el feedback de conversaciones IA del taller',
  })
  await deleteOptionalByIn(supabase, 'lia_messages', 'conversation_id', conversationIds, {
    label: 'los mensajes de conversaciones IA del taller',
  })
  await deleteOptionalByIn(
    supabase,
    'lia_activity_completions',
    'conversation_id',
    conversationIds,
    { label: 'las completaciones de actividades IA del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'user_quiz_submissions',
    'material_id',
    materialIds,
    { label: 'los intentos de quiz asociados a materiales del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'user_quiz_submissions',
    'activity_id',
    activityIds,
    { label: 'los intentos de quiz asociados a actividades del taller' },
  )
  await deleteOptionalByIn(supabase, 'lia_conversations', 'activity_id', activityIds, {
    label: 'las conversaciones IA asociadas a actividades del taller',
  })
  await deleteOptionalByIn(
    supabase,
    'lia_common_questions',
    'activity_id',
    activityIds,
    { label: 'las preguntas frecuentes IA asociadas a actividades del taller' },
  )

  await deleteOptionalByIn(
    supabase,
    'user_quiz_submissions',
    'lesson_id',
    lessonIds,
    { label: 'los intentos de quiz asociados a lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'study_sessions',
    'lesson_id',
    lessonIds,
    { label: 'las sesiones de estudio del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'user_lesson_notes',
    'lesson_id',
    lessonIds,
    { label: 'las notas de lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'user_lesson_progress',
    'lesson_id',
    lessonIds,
    { label: 'el progreso de lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'lesson_feedback',
    'lesson_id',
    lessonIds,
    { label: 'la retroalimentacion de lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'lesson_tracking',
    'lesson_id',
    lessonIds,
    { label: 'el tracking de lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'lesson_time_estimates',
    'lesson_id',
    lessonIds,
    { label: 'las estimaciones de tiempo de lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'lesson_checkpoints',
    'lesson_id',
    lessonIds,
    { label: 'los checkpoints de lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'lia_common_questions',
    'lesson_id',
    lessonIds,
    { label: 'las preguntas frecuentes IA asociadas a lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'lia_conversations',
    'lesson_id',
    lessonIds,
    { label: 'las conversaciones IA asociadas a lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'user_activity_log',
    'lesson_id',
    lessonIds,
    { label: 'la bitacora de actividad de lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'user_activity_submissions',
    'lesson_id',
    lessonIds,
    { label: 'las entregas de actividades de lecciones del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'lesson_chat_suggestions',
    'lesson_id',
    lessonIds,
    { label: 'las sugerencias de chat de lecciones del taller' },
  )
  await deleteByIn(
    supabase,
    'lesson_materials',
    'lesson_id',
    lessonIds,
    { label: 'los materiales de las lecciones del taller' },
  )
  await deleteByIn(
    supabase,
    'lesson_activities',
    'lesson_id',
    lessonIds,
    { label: 'las actividades de las lecciones del taller' },
  )
  await deleteByIn(supabase, 'course_lessons', 'lesson_id', lessonIds, {
    label: 'las lecciones del taller',
  })
  await deleteOptionalByIn(supabase, 'course_lessons_en', 'lesson_id', lessonIds, {
    label: 'las lecciones del taller (en)',
  })
  await deleteOptionalByIn(supabase, 'course_lessons_pt', 'lesson_id', lessonIds, {
    label: 'las lecciones del taller (pt)',
  })

  await deleteOptionalByIn(supabase, 'lia_conversations', 'module_id', moduleIds, {
    label: 'las conversaciones IA asociadas a modulos del taller',
  })
  await deleteOptionalByIn(
    supabase,
    'user_module_progress',
    'module_id',
    moduleIds,
    {
      label: 'el progreso de modulos del taller',
      ignoreMissingRelation: true,
    },
  )
  await deleteByIn(supabase, 'course_modules', 'module_id', moduleIds, {
    label: 'los modulos del taller',
  })

  await deleteOptionalByIn(supabase, 'work_team_course_assignments', 'team_id', teamIds, {
    label: 'las asignaciones de equipos del taller',
  })
  await deleteOptionalByIn(supabase, 'work_team_feedback', 'team_id', teamIds, {
    label: 'la retroalimentacion de equipos del taller',
  })
  await deleteOptionalByIn(supabase, 'work_team_messages', 'team_id', teamIds, {
    label: 'los mensajes de equipos del taller',
  })
  await deleteOptionalByIn(supabase, 'work_team_objectives', 'team_id', teamIds, {
    label: 'los objetivos de equipos del taller',
  })
  await deleteOptionalByIn(supabase, 'work_team_statistics', 'team_id', teamIds, {
    label: 'las estadisticas de equipos del taller',
  })
  await deleteOptionalByIn(supabase, 'work_team_members', 'team_id', teamIds, {
    label: 'los miembros de equipos del taller',
  })
  await deleteOptionalByEq(supabase, 'work_teams', 'course_id', workshopId, {
    label: 'los equipos de trabajo del taller',
  })

  await deleteOptionalByIn(
    supabase,
    'course_question_reactions',
    'response_id',
    responseIds,
    { label: 'las reacciones de respuestas del foro del taller' },
  )
  await deleteOptionalByIn(
    supabase,
    'course_question_reactions',
    'question_id',
    questionIds,
    { label: 'las reacciones de preguntas del foro del taller' },
  )
  await deleteOptionalByEq(
    supabase,
    'course_question_responses',
    'course_id',
    workshopId,
    { label: 'las respuestas del foro del taller' },
  )
  await deleteOptionalByEq(supabase, 'course_questions', 'course_id', workshopId, {
    label: 'las preguntas del foro del taller',
  })
  await deleteOptionalByEq(supabase, 'course_reviews', 'course_id', workshopId, {
    label: 'las resenas del taller',
  })
  await deleteOptionalByEq(supabase, 'course_skills', 'course_id', workshopId, {
    label: 'las habilidades del taller',
  })
  await deleteOptionalByEq(
    supabase,
    'hierarchy_course_assignments',
    'course_id',
    workshopId,
    {
      label: 'las asignaciones jerarquicas del taller',
      ignoreMissingRelation: true,
    },
  )
  await deleteOptionalByEq(
    supabase,
    'organization_course_assignments',
    'course_id',
    workshopId,
    { label: 'las asignaciones organizacionales del taller' },
  )
  await deleteOptionalByEq(
    supabase,
    'organization_course_purchases',
    'course_id',
    workshopId,
    { label: 'las compras organizacionales del taller' },
  )
  await deleteOptionalByEq(supabase, 'lia_conversations', 'course_id', workshopId, {
    label: 'las conversaciones IA del taller',
  })
  await deleteOptionalByEq(supabase, 'scorm_packages', 'course_id', workshopId, {
    label: 'los paquetes SCORM del taller',
  })
  await deleteOptionalByEq(supabase, 'subscriptions', 'course_id', workshopId, {
    label: 'las suscripciones del taller',
  })
  await deleteOptionalByEq(supabase, 'transactions', 'course_id', workshopId, {
    label: 'las transacciones del taller',
  })
  await deleteOptionalByEq(supabase, 'user_activity_log', 'course_id', workshopId, {
    label: 'la bitacora de actividad del taller',
  })
  await deleteOptionalByEq(
    supabase,
    'user_course_certificates',
    'course_id',
    workshopId,
    { label: 'los certificados emitidos del taller' },
  )
  await deleteOptionalByEq(
    supabase,
    'user_course_enrollments',
    'course_id',
    workshopId,
    { label: 'las inscripciones del taller' },
  )

  await deleteByEq(supabase, 'courses', 'id', workshopId, {
    label: 'el taller',
  })
}

async function collectCourseHierarchyIds(
  supabase: SupabaseClient,
  workshopId: string,
): Promise<CourseHierarchyIds> {
  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', workshopId)

  if (modulesError) {
    throw buildDeletionError(
      'No se pudieron consultar los modulos del taller',
      modulesError,
    )
  }

  const moduleIds = uniqIds(
    (modules || []).map((module: { module_id: string }) => module.module_id),
  )

  const { data: lessons, error: lessonsError } = moduleIds.length
    ? await supabase
        .from('course_lessons')
        .select('lesson_id')
        .in('module_id', moduleIds)
    : { data: [], error: null }

  if (lessonsError) {
    throw buildDeletionError(
      'No se pudieron consultar las lecciones del taller',
      lessonsError,
    )
  }

  const lessonIds = uniqIds(
    (lessons || []).map((lesson: { lesson_id: string }) => lesson.lesson_id),
  )

  const { data: materials, error: materialsError } = lessonIds.length
    ? await supabase
        .from('lesson_materials')
        .select('material_id')
        .in('lesson_id', lessonIds)
    : { data: [], error: null }

  if (materialsError) {
    throw buildDeletionError(
      'No se pudieron consultar los materiales del taller',
      materialsError,
    )
  }

  const materialIds = uniqIds(
    (materials || []).map(
      (material: { material_id: string }) => material.material_id,
    ),
  )

  const { data: activities, error: activitiesError } = lessonIds.length
    ? await supabase
        .from('lesson_activities')
        .select('activity_id')
        .in('lesson_id', lessonIds)
    : { data: [], error: null }

  if (activitiesError) {
    throw buildDeletionError(
      'No se pudieron consultar las actividades del taller',
      activitiesError,
    )
  }

  const activityIds = uniqIds(
    (activities || []).map(
      (activity: { activity_id: string }) => activity.activity_id,
    ),
  )

  const teamIds = await selectIdsByEq(
    supabase,
    'work_teams',
    'team_id',
    'course_id',
    workshopId,
    'No se pudieron consultar los equipos del taller',
    { ignoreMissingRelation: true },
  )

  const certificateIds = await selectIdsByEq(
    supabase,
    'user_course_certificates',
    'certificate_id',
    'course_id',
    workshopId,
    'No se pudieron consultar los certificados del taller',
    { ignoreMissingRelation: true },
  )

  const questionIds = await selectIdsByEq(
    supabase,
    'course_questions',
    'id',
    'course_id',
    workshopId,
    'No se pudieron consultar las preguntas del foro del taller',
    { ignoreMissingRelation: true },
  )

  const responseIds = await selectIdsByEq(
    supabase,
    'course_question_responses',
    'id',
    'course_id',
    workshopId,
    'No se pudieron consultar las respuestas del foro del taller',
    { ignoreMissingRelation: true },
  )

  const conversationIds = await collectConversationIds(
    supabase,
    workshopId,
    moduleIds,
    lessonIds,
    activityIds,
  )

  return {
    moduleIds,
    lessonIds,
    materialIds,
    activityIds,
    teamIds,
    certificateIds,
    conversationIds,
    questionIds,
    responseIds,
  }
}

async function collectConversationIds(
  supabase: SupabaseClient,
  workshopId: string,
  moduleIds: string[],
  lessonIds: string[],
  activityIds: string[],
): Promise<string[]> {
  const conversationIds = new Set<string>()

  const courseConversationIds = await selectIdsByEq(
    supabase,
    'lia_conversations',
    'conversation_id',
    'course_id',
    workshopId,
    'No se pudieron consultar las conversaciones IA del taller',
    { ignoreMissingRelation: true },
  )

  for (const conversationId of courseConversationIds) {
    conversationIds.add(conversationId)
  }

  await appendConversationIdsByIn(
    supabase,
    conversationIds,
    'module_id',
    moduleIds,
    'No se pudieron consultar las conversaciones IA de modulos del taller',
  )
  await appendConversationIdsByIn(
    supabase,
    conversationIds,
    'lesson_id',
    lessonIds,
    'No se pudieron consultar las conversaciones IA de lecciones del taller',
  )
  await appendConversationIdsByIn(
    supabase,
    conversationIds,
    'activity_id',
    activityIds,
    'No se pudieron consultar las conversaciones IA de actividades del taller',
  )

  return Array.from(conversationIds)
}

async function appendConversationIdsByIn(
  supabase: SupabaseClient,
  target: Set<string>,
  column: 'module_id' | 'lesson_id' | 'activity_id',
  values: string[],
  errorMessage: string,
): Promise<void> {
  if (!values.length) {
    return
  }

  const conversationIds = await selectIdsByIn(
    supabase,
    'lia_conversations',
    'conversation_id',
    column,
    values,
    errorMessage,
    { ignoreMissingRelation: true },
  )

  for (const conversationId of conversationIds) {
    target.add(conversationId)
  }
}

async function deleteContentTranslations(
  supabase: SupabaseClient,
  entityType: 'course' | 'module' | 'lesson' | 'activity' | 'material',
  entityIds: string[],
): Promise<void> {
  if (!entityIds.length) {
    return
  }

  await executeDelete(
    `las traducciones de ${entityType}`,
    fromLoose(supabase, 'content_translations')
      .delete()
      .eq('entity_type', entityType)
      .in('entity_id', entityIds),
    { ignoreMissingRelation: true },
  )
}

async function selectIdsByEq(
  supabase: SupabaseClient,
  tableName: string,
  idColumn: string,
  filterColumn: string,
  filterValue: string,
  errorMessage: string,
  options: TableSelectOptions = {},
): Promise<string[]> {
  const { data, error } = await fromLoose<Record<string, string | null | undefined>>(
    supabase,
    tableName,
  )
    .select(idColumn)
    .eq(filterColumn, filterValue)

  if (error) {
    if (options.ignoreMissingRelation && isMissingRelationError(error)) {
      return []
    }

    throw buildDeletionError(errorMessage, error)
  }

  return uniqIds((data || []).map((row) => row[idColumn] || ''))
}

async function selectIdsByIn(
  supabase: SupabaseClient,
  tableName: string,
  idColumn: string,
  filterColumn: string,
  filterValues: string[],
  errorMessage: string,
  options: TableSelectOptions = {},
): Promise<string[]> {
  if (!filterValues.length) {
    return []
  }

  const { data, error } = await fromLoose<Record<string, string | null | undefined>>(
    supabase,
    tableName,
  )
    .select(idColumn)
    .in(filterColumn, filterValues)

  if (error) {
    if (options.ignoreMissingRelation && isMissingRelationError(error)) {
      return []
    }

    throw buildDeletionError(errorMessage, error)
  }

  return uniqIds((data || []).map((row) => row[idColumn] || ''))
}

async function deleteByEq(
  supabase: SupabaseClient,
  tableName: string,
  column: string,
  value: string,
  options: TableDeleteOptions = {},
): Promise<void> {
  await executeDelete(
    options.label || `los registros de ${tableName}`,
    fromLoose(supabase, tableName).delete().eq(column, value),
    options,
  )
}

async function deleteOptionalByEq(
  supabase: SupabaseClient,
  tableName: string,
  column: string,
  value: string,
  options: TableDeleteOptions = {},
): Promise<void> {
  await deleteByEq(supabase, tableName, column, value, {
    ...options,
    ignoreMissingRelation: true,
  })
}

async function deleteByIn(
  supabase: SupabaseClient,
  tableName: string,
  column: string,
  values: string[],
  options: TableDeleteOptions = {},
): Promise<void> {
  if (!values.length) {
    return
  }

  await executeDelete(
    options.label || `los registros de ${tableName}`,
    fromLoose(supabase, tableName).delete().in(column, values),
    options,
  )
}

async function deleteOptionalByIn(
  supabase: SupabaseClient,
  tableName: string,
  column: string,
  values: string[],
  options: TableDeleteOptions = {},
): Promise<void> {
  await deleteByIn(supabase, tableName, column, values, {
    ...options,
    ignoreMissingRelation: true,
  })
}

async function executeDelete(
  label: string,
  operation: DeleteOperationResult,
  options: TableDeleteOptions = {},
): Promise<void> {
  const { error } = await operation

  if (!error) {
    return
  }

  if (options.ignoreMissingRelation && isMissingRelationError(error)) {
    return
  }

  throw buildDeletionError(`No se pudieron eliminar ${label}`, error)
}

function buildDeletionError(message: string, error: LooseQueryError): Error {
  const formattedMessage =
    error.message?.trim().length > 0 ? `${message}: ${error.message}` : message

  if (error.code === FOREIGN_KEY_VIOLATION_CODE) {
    return new WorkshopDeletionError(formattedMessage, 409, { cause: error })
  }

  return new WorkshopDeletionError(formattedMessage, 500, { cause: error })
}

function isMissingRelationError(error: LooseQueryError): boolean {
  const normalizedMessage = (error.message || '').toLowerCase()

  return (
    error.code === RELATION_NOT_FOUND_CODE ||
    error.code === SCHEMA_CACHE_RELATION_NOT_FOUND_CODE ||
    normalizedMessage.includes('could not find the table') ||
    normalizedMessage.includes('relation') && normalizedMessage.includes('does not exist') ||
    normalizedMessage.includes('schema cache')
  )
}

function uniqIds(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}
