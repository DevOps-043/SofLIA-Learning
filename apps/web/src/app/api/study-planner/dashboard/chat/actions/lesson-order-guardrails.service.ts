import type { Database } from '@/lib/supabase/types'
import { createAdminClient, parseSessionMetrics } from '../calendar.service'

type StudySessionRow = Pick<
  Database['public']['Tables']['study_sessions']['Row'],
  'id' | 'plan_id' | 'course_id' | 'lesson_id' | 'start_time' | 'status' | 'title' | 'metrics'
>

type LessonMetadataRow = {
  lesson_id: string
  lesson_order_index: number
  module_id: string
}

type ModuleMetadataRow = {
  module_id: string
  module_order_index: number
  course_id: string
}

type PendingLessonRef = {
  courseId: string
  lessonId: string
  lessonTitle?: string
  moduleOrderIndex: number
  lessonOrderIndex: number
}

type SessionOrderEntry = {
  sessionId: string
  title: string
  courseId: string
  startTime: string
  sequence: { moduleOrderIndex: number; lessonOrderIndex: number }
}

type OrderValidationResult = {
  valid: boolean
  code?: 'lesson_order_violation' | 'lesson_order_validation_failed'
  message?: string
}

type ProposedMove = {
  sessionId: string
  newStartTime: string
}

type ProposedCreate = {
  title?: string
  startTime: string
  courseId?: string
  lessonId?: string
}

export function validateLessonOrderEntries(entries: SessionOrderEntry[]): OrderValidationResult {
  const sortedEntries = [...entries].sort((left, right) => {
    const startDiff = new Date(left.startTime).getTime() - new Date(right.startTime).getTime()
    if (startDiff !== 0) {
      return startDiff
    }

    return compareSequence(left.sequence, right.sequence)
  })

  for (let index = 0; index < sortedEntries.length - 1; index += 1) {
    const current = sortedEntries[index]
    const next = sortedEntries[index + 1]

    if (current.courseId !== next.courseId) {
      continue
    }

    if (compareSequence(current.sequence, next.sequence) > 0) {
      return {
        valid: false,
        code: 'lesson_order_violation',
        message:
          `No puedo dejar "${current.title}" antes que "${next.title}" `
          + 'porque romper\u00eda el orden estricto de lecciones pendientes del curso.',
      }
    }
  }

  return { valid: true }
}

export async function validateStrictLessonOrder(params: {
  userId: string
  planId: string
  proposedMoves?: ProposedMove[]
  proposedCreates?: ProposedCreate[]
}): Promise<OrderValidationResult> {
  const supabase = createAdminClient()
  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('id, plan_id, course_id, lesson_id, start_time, status, title, metrics')
    .eq('user_id', params.userId)
    .eq('plan_id', params.planId)

  if (error || !sessions) {
    return buildValidationFailureResult(
      'No pude validar el orden de lecciones porque no fue posible cargar las sesiones del plan.',
    )
  }

  const moveOverrides = new Map(
    (params.proposedMoves || []).map((move) => [move.sessionId, move.newStartTime]),
  )

  const allLessonIds = collectLessonIds(
    sessions,
    (params.proposedCreates || []).flatMap((item) => item.lessonId ? [item.lessonId] : []),
  )

  const lessonMetadataResult = await loadLessonMetadata(allLessonIds)
  if (!lessonMetadataResult.valid) {
    return lessonMetadataResult
  }

  const completedLessonIdsResult = await loadCompletedLessonIds(params.userId, allLessonIds)
  if (!completedLessonIdsResult.valid) {
    return completedLessonIdsResult
  }

  const entries = buildEntriesForExistingSessions({
    sessions,
    lessonMetadata: lessonMetadataResult.metadata,
    completedLessonIds: completedLessonIdsResult.completedLessonIds,
    moveOverrides,
  })

  for (const createProposal of params.proposedCreates || []) {
    const createEntry = buildEntryForCreateProposal({
      createProposal,
      lessonMetadata: lessonMetadataResult.metadata,
      completedLessonIds: completedLessonIdsResult.completedLessonIds,
    })
    if (createEntry) {
      entries.push(createEntry)
    }
  }

  return validateLessonOrderEntries(entries)
}

async function loadLessonMetadata(lessonIds: string[]): Promise<
  | { valid: true; metadata: Map<string, PendingLessonRef> }
  | OrderValidationResult
> {
  if (lessonIds.length === 0) {
    return { valid: true, metadata: new Map() }
  }

  const supabase = createAdminClient()
  const { data: lessonRows, error: lessonError } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_order_index, module_id')
    .in('lesson_id', lessonIds)

  if (lessonError || !lessonRows) {
    return buildValidationFailureResult(
      'No pude validar el orden de lecciones porque falt\u00f3 metadata de lecciones.',
    )
  }

  const moduleIds = Array.from(new Set(lessonRows.map((row) => row.module_id).filter(Boolean)))
  const { data: moduleRows, error: moduleError } = moduleIds.length === 0
    ? { data: [] as ModuleMetadataRow[], error: null }
    : await supabase
      .from('course_modules')
      .select('module_id, module_order_index, course_id')
      .in('module_id', moduleIds)

  if (moduleError || !moduleRows) {
    return buildValidationFailureResult(
      'No pude validar el orden de lecciones porque falt\u00f3 metadata de m\u00f3dulos.',
    )
  }

  const moduleById = new Map<string, ModuleMetadataRow>()
  for (const row of moduleRows as ModuleMetadataRow[]) {
    moduleById.set(row.module_id, row)
  }

  const metadataByLessonId = new Map<string, PendingLessonRef>()
  for (const row of lessonRows as LessonMetadataRow[]) {
    const module = moduleById.get(row.module_id)
    if (!module) {
      return buildValidationFailureResult(
        'No pude validar el orden de lecciones porque algunas lecciones no tienen m\u00f3dulo asociado.',
      )
    }

    metadataByLessonId.set(row.lesson_id, {
      courseId: module.course_id,
      lessonId: row.lesson_id,
      moduleOrderIndex: module.module_order_index,
      lessonOrderIndex: row.lesson_order_index,
    })
  }

  return { valid: true, metadata: metadataByLessonId }
}

async function loadCompletedLessonIds(
  userId: string,
  lessonIds: string[],
): Promise<
  | { valid: true; completedLessonIds: Set<string> }
  | OrderValidationResult
> {
  if (lessonIds.length === 0) {
    return { valid: true, completedLessonIds: new Set() }
  }

  const supabase = createAdminClient()
  const { data: progressRows, error } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, is_completed')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)

  if (error || !progressRows) {
    return buildValidationFailureResult(
      'No pude validar el orden de lecciones porque no fue posible consultar el progreso del usuario.',
    )
  }

  return {
    valid: true,
    completedLessonIds: new Set(
      progressRows
        .filter((row) => Boolean(row.is_completed))
        .map((row) => row.lesson_id),
    ),
  }
}

function buildEntriesForExistingSessions(params: {
  sessions: StudySessionRow[]
  lessonMetadata: Map<string, PendingLessonRef>
  completedLessonIds: Set<string>
  moveOverrides: Map<string, string>
}): SessionOrderEntry[] {
  const entries: SessionOrderEntry[] = []

  for (const session of params.sessions) {
    const pendingLesson = resolvePendingLessonForSession(
      session,
      params.lessonMetadata,
      params.completedLessonIds,
    )

    if (!pendingLesson) {
      continue
    }

    entries.push({
      sessionId: session.id,
      title: session.title,
      courseId: pendingLesson.courseId,
      startTime: params.moveOverrides.get(session.id) || session.start_time,
      sequence: {
        moduleOrderIndex: pendingLesson.moduleOrderIndex,
        lessonOrderIndex: pendingLesson.lessonOrderIndex,
      },
    })
  }

  return entries
}

function buildEntryForCreateProposal(params: {
  createProposal: ProposedCreate
  lessonMetadata: Map<string, PendingLessonRef>
  completedLessonIds: Set<string>
}): SessionOrderEntry | null {
  const { createProposal } = params
  if (!createProposal.courseId || !createProposal.lessonId) {
    return null
  }

  if (params.completedLessonIds.has(createProposal.lessonId)) {
    return null
  }

  const metadata = params.lessonMetadata.get(createProposal.lessonId)
  if (!metadata) {
    return null
  }

  return {
    sessionId: `new:${createProposal.lessonId}`,
    title: createProposal.title || 'Nueva sesi\u00f3n',
    courseId: createProposal.courseId,
    startTime: createProposal.startTime,
    sequence: {
      moduleOrderIndex: metadata.moduleOrderIndex,
      lessonOrderIndex: metadata.lessonOrderIndex,
    },
  }
}

function resolvePendingLessonForSession(
  session: StudySessionRow,
  lessonMetadata: Map<string, PendingLessonRef>,
  completedLessonIds: Set<string>,
): PendingLessonRef | null {
  const metrics = parseSessionMetrics(session.metrics)
  const plannedLessons = (metrics?.plannedLessons || [])
    .map((lesson) => {
      if (!lesson.lessonId) {
        return null
      }

      const metadata = lessonMetadata.get(lesson.lessonId)
      const moduleOrderIndex = lesson.moduleOrderIndex ?? metadata?.moduleOrderIndex
      const lessonOrderIndex = lesson.lessonOrderIndex ?? metadata?.lessonOrderIndex
      const courseId = lesson.courseId || metadata?.courseId || session.course_id || undefined

      if (
        !courseId
        || moduleOrderIndex === undefined
        || lessonOrderIndex === undefined
      ) {
        return null
      }

      return {
        courseId,
        lessonId: lesson.lessonId,
        lessonTitle: lesson.lessonTitle,
        moduleOrderIndex,
        lessonOrderIndex,
      } satisfies PendingLessonRef
    })
    .filter((lesson): lesson is PendingLessonRef => Boolean(lesson))

  const pendingFromMetrics = plannedLessons
    .filter((lesson) => !completedLessonIds.has(lesson.lessonId))
    .sort(comparePendingLessonRefs)

  if (pendingFromMetrics.length > 0) {
    return pendingFromMetrics[0]
  }

  if (!session.lesson_id || completedLessonIds.has(session.lesson_id)) {
    return null
  }

  return lessonMetadata.get(session.lesson_id) || null
}

function collectLessonIds(
  sessions: StudySessionRow[],
  proposedCreateLessonIds: string[],
): string[] {
  return Array.from(
    new Set([
      ...proposedCreateLessonIds,
      ...sessions.flatMap((session) => {
        const metrics = parseSessionMetrics(session.metrics)
        const plannedLessonIds = (metrics?.plannedLessons || [])
          .map((lesson) => lesson.lessonId)
          .filter((lessonId): lessonId is string => Boolean(lessonId))

        return [
          ...(session.lesson_id ? [session.lesson_id] : []),
          ...plannedLessonIds,
        ]
      }),
    ]),
  )
}

function comparePendingLessonRefs(left: PendingLessonRef, right: PendingLessonRef): number {
  return compareSequence(
    {
      moduleOrderIndex: left.moduleOrderIndex,
      lessonOrderIndex: left.lessonOrderIndex,
    },
    {
      moduleOrderIndex: right.moduleOrderIndex,
      lessonOrderIndex: right.lessonOrderIndex,
    },
  )
}

function compareSequence(
  left: { moduleOrderIndex: number; lessonOrderIndex: number },
  right: { moduleOrderIndex: number; lessonOrderIndex: number },
): number {
  if (left.moduleOrderIndex !== right.moduleOrderIndex) {
    return left.moduleOrderIndex - right.moduleOrderIndex
  }

  return left.lessonOrderIndex - right.lessonOrderIndex
}

function buildValidationFailureResult(message: string): OrderValidationResult {
  return {
    valid: false,
    code: 'lesson_order_validation_failed',
    message,
  }
}
