import { generateStudyPlannerPrompt } from '../prompts/study-planner.prompt'
import type { LessonData } from '../hooks/useSofLIAData'
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerMessage,
  StudyPlannerPendingLesson,
} from '../types/planner-ui.types'
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types'
import {
  buildFreeSlotsContext,
  buildWorkBlockScheduleContext,
  fetchCalendarEventsAsDataMap,
} from './planner-chat-calendar-context.service'
import {
  buildDeterministicPlanContext,
  buildDueDateContext,
  buildExistingPlanContext,
  buildFallbackLessonsContext,
  detectExplicitSessionDuration,
} from './planner-chat-planning-context.service'

interface BuildStudyPlannerChatRequestContextParams {
  message: string
  userName?: string | null
  lessonsAreReady: boolean
  lessons: LessonData[]
  getLessonsForPrompt: (selectedCourseIds?: string[]) => string
  pendingLessons: StudyPlannerPendingLesson[]
  totalPendingLessons: number
  assignedCourses: StudyPlannerAssignedCourse[]
  connectedCalendar: 'google' | 'microsoft' | null
  selectedCourseIds?: string[]
  studyApproach: StudyApproach | null
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[]
  calendarData?: StudyPlannerCalendarDataMap | null
}

interface SendStudyPlannerChatRequestParams {
  message: string
  conversationHistory: StudyPlannerMessage[]
  systemPrompt: string
  signal?: AbortSignal
  userName?: string | null
}

interface StudyPlannerChatRequestResult {
  response: string
  conversationId?: string
}

function buildFinalStudyPlannerContext(params: {
  filteredPendingCount: number
  lessonsContext: string
  connectedCalendar: 'google' | 'microsoft' | null
  freeSlotsContext: string
  workBlockContext: string
  dueDateContext: string
  deterministicPlanContext: string
  existingPlanContext: string
  blockPlanGeneration: boolean
}): string {
  if (params.blockPlanGeneration) {
    return `SISTEMA: INFORMACION DE LECCIONES OCULTA POR INSUFICIENCIA DE HORARIO.\n${params.deterministicPlanContext}`
  }

  return [
    `LECCIONES PENDIENTES (${params.filteredPendingCount} total):`,
    params.lessonsContext,
    '',
    `CALENDARIO: ${params.connectedCalendar ? `Conectado (${params.connectedCalendar})` : 'No conectado'}${params.freeSlotsContext}${params.workBlockContext}${params.dueDateContext}${params.deterministicPlanContext}${params.existingPlanContext}`,
  ].join('\n')
}

export async function buildStudyPlannerChatRequestContext(
  params: BuildStudyPlannerChatRequestContextParams,
): Promise<{ systemPrompt: string }> {
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const resolvedCourseIds =
    params.selectedCourseIds && params.selectedCourseIds.length > 0
      ? params.selectedCourseIds
      : undefined

  const filteredLessons = resolvedCourseIds?.length
    ? params.lessons.filter((lesson) => resolvedCourseIds.includes(lesson.courseId))
    : params.lessons

  const lessonsContext =
    params.lessonsAreReady && filteredLessons.length > 0
      ? params.getLessonsForPrompt(params.selectedCourseIds)
      : buildFallbackLessonsContext(params.pendingLessons, resolvedCourseIds)

  const filteredPendingCount = filteredLessons.length || params.totalPendingLessons
  const dueDateContext = buildDueDateContext(params.assignedCourses, resolvedCourseIds)
  const existingPlanContext = buildExistingPlanContext(params.savedLessonDistribution)
  const explicitDuration = detectExplicitSessionDuration(params.message)

  const effectiveCalendarData =
    params.calendarData ?? (params.connectedCalendar ? await fetchCalendarEventsAsDataMap() : null)

  const deterministicContext = await buildDeterministicPlanContext({
    message: params.message,
    lessons: filteredLessons,
    assignedCourses: params.assignedCourses,
    studyApproach: params.studyApproach,
    explicitSessionMinutes: explicitDuration,
    resolvedCourseIds,
    calendarData: effectiveCalendarData,
  })

  const workBlockContext = effectiveCalendarData
    ? buildWorkBlockScheduleContext(effectiveCalendarData)
    : ''
  const freeSlotsContext = effectiveCalendarData
    ? buildFreeSlotsContext(effectiveCalendarData)
    : ''

  const studyPlannerContextString = buildFinalStudyPlannerContext({
    filteredPendingCount,
    lessonsContext,
    connectedCalendar: params.connectedCalendar,
    freeSlotsContext,
    workBlockContext,
    dueDateContext,
    deterministicPlanContext: deterministicContext.preCalculatedPlanContext,
    existingPlanContext,
    blockPlanGeneration: deterministicContext.blockPlanGeneration,
  })

  return {
    systemPrompt: generateStudyPlannerPrompt({
      userName: params.userName || undefined,
      studyPlannerContextString,
      currentDate,
    }),
  }
}

export async function sendStudyPlannerChatRequest(
  params: SendStudyPlannerChatRequestParams,
): Promise<StudyPlannerChatRequestResult> {
  const response = await fetch('/api/study-planner-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: params.signal,
    body: JSON.stringify({
      message: params.message,
      conversationHistory: params.conversationHistory,
      systemPrompt: params.systemPrompt,
      userName: params.userName || undefined,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Error al comunicarse con SofLIA: ${response.status} ${response.statusText}. ${errorText}`,
    )
  }

  const payload = (await response.json()) as StudyPlannerChatRequestResult
  return {
    response: payload.response,
    conversationId: payload.conversationId,
  }
}
