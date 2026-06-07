import type { LessonData } from '../hooks/useSofLIAData'
import type {
  StudyApproach,
  StudyPlannerAssignedCourse,
  StudyPlannerPendingLesson,
} from '../types/planner-ui.types'
import type {
  StudyPlannerCalendarDataMap,
  StudyPlannerStoredLessonDistribution,
} from '../types/planner-schedule.types'
import {
  buildCalendarPlanningConstraints,
  deriveWorkBlockDaysFromCalendar,
} from './planner-chat-calendar-context.service'
import {
  detectPlannerDays,
  detectPlannerTimes,
} from './planner-chat-preferences-parser.service'
import { userExplicitlyAllowsSunday } from './sunday-eligibility.service'

export { detectExplicitSessionDuration } from './planner-chat-preferences-parser.service'

interface DeterministicPlanAlternative {
  description: string
  estimatedEndDate: string
  daysBeforeDeadline: number
}

interface DeterministicPlanResponse {
  exceedsDeadline?: boolean
  validAlternatives?: DeterministicPlanAlternative[]
  plan?: string
  endDate?: string
  deadline?: string
  daysExcess?: number
}

export interface DeterministicPlanContextResult {
  blockPlanGeneration: boolean
  preCalculatedPlanContext: string
}

export function buildFallbackLessonsContext(
  pendingLessons: StudyPlannerPendingLesson[],
  resolvedCourseIds?: string[],
): string {
  const filtered = resolvedCourseIds?.length
    ? pendingLessons.filter((lesson) => resolvedCourseIds.includes(lesson.courseId))
    : pendingLessons

  if (filtered.length === 0) {
    return 'No hay lecciones pendientes definidas aun.'
  }

  return filtered
    .map(
      (lesson) =>
        `- ${lesson.lessonTitle} (${lesson.durationMinutes || 15} min) - Modulo: ${lesson.moduleTitle}`,
    )
    .join('\n')
}

export function buildDueDateContext(
  assignedCourses: StudyPlannerAssignedCourse[],
  resolvedCourseIds?: string[],
): string {
  const relevantCourses = resolvedCourseIds?.length
    ? assignedCourses.filter((course) => resolvedCourseIds.includes(course.courseId))
    : assignedCourses

  const coursesWithDueDates = relevantCourses.filter((course) => course.dueDate)
  if (coursesWithDueDates.length === 0) {
    return ''
  }

  const nearestDueDate = [...coursesWithDueDates].sort(
    (left, right) => new Date(left.dueDate!).getTime() - new Date(right.dueDate!).getTime(),
  )[0]

  const dueDateFormatted = new Date(nearestDueDate.dueDate!).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return `\n\nFECHA LIMITE OBLIGATORIA: ${dueDateFormatted}\nNunca programes lecciones despues de esta fecha.`
}

export function buildExistingPlanContext(
  savedLessonDistribution: StudyPlannerStoredLessonDistribution[],
): string {
  if (savedLessonDistribution.length === 0) {
    return ''
  }

  const slots = savedLessonDistribution
    .slice(0, 20)
    .map((slot) => {
      const lessons = slot.lessons.map((lesson) => lesson.lessonTitle).join(', ')
      return `- ${slot.dayName} ${slot.dateStr} ${slot.startTime}-${slot.endTime}: ${lessons}`
    })
    .join('\n')

  return `\n\nPLAN EXISTENTE EN MEMORIA:\n${slots}\n\nSi el usuario esta confirmando o ajustando este plan, reutiliza exactamente estos horarios como base.`
}

function getNearestDeadlineDate(
  assignedCourses: StudyPlannerAssignedCourse[],
  resolvedCourseIds?: string[],
): string | undefined {
  const relevantCourses = resolvedCourseIds?.length
    ? assignedCourses.filter((course) => resolvedCourseIds.includes(course.courseId))
    : assignedCourses

  const coursesWithDueDates = relevantCourses.filter((course) => course.dueDate)
  if (coursesWithDueDates.length === 0) {
    return undefined
  }

  return [...coursesWithDueDates].sort(
    (left, right) => new Date(left.dueDate!).getTime() - new Date(right.dueDate!).getTime(),
  )[0].dueDate ?? undefined
}

function buildAlternativesContext(alternatives: DeterministicPlanAlternative[]): string {
  if (alternatives.length === 0) {
    return [
      'ADVERTENCIA: La fecha limite es muy ajustada.',
      'Para completar el curso a tiempo necesitas estudiar todos los dias con sesiones intensivas.',
      'Considera solicitar una extension de la fecha limite a tu instructor.',
    ].join('\n')
  }

  return alternatives
    .map((alternative, index) =>
      [
        `OPCION ${index + 1}: ${alternative.description}`,
        `   Terminarias el ${alternative.estimatedEndDate} (${alternative.daysBeforeDeadline} dias antes del deadline)`,
      ].join('\n'),
    )
    .join('\n\n')
}

export async function buildDeterministicPlanContext(params: {
  assignedCourses: StudyPlannerAssignedCourse[]
  lessons: LessonData[]
  message: string
  studyApproach: StudyApproach | null
  calendarData?: StudyPlannerCalendarDataMap | null
  explicitSessionMinutes?: number | null
  resolvedCourseIds?: string[]
}): Promise<DeterministicPlanContextResult> {
  let uniqueDays = detectPlannerDays(params.message)
  const explicitSundayAllowed = userExplicitlyAllowsSunday(params.message)

  if (uniqueDays.length === 0 && params.calendarData) {
    uniqueDays = deriveWorkBlockDaysFromCalendar(params.calendarData)
  }

  const hasSundayWorkBlock = params.calendarData
    ? deriveWorkBlockDaysFromCalendar(params.calendarData).includes('domingo')
    : false
  const allowSunday = explicitSundayAllowed || hasSundayWorkBlock
  uniqueDays = uniqueDays.filter((day) => day !== 'domingo' || allowSunday)

  if (uniqueDays.length === 0 || params.lessons.length === 0) {
    return { blockPlanGeneration: false, preCalculatedPlanContext: '' }
  }

  const uniqueTimes = detectPlannerTimes(params.message)
  const deadlineDate = getNearestDeadlineDate(params.assignedCourses, params.resolvedCourseIds)

  const approachBasedMinutes =
    params.studyApproach === 'corto' ? 75 : params.studyApproach === 'largo' ? 25 : 45
  const maxSessionMinutes = params.explicitSessionMinutes ?? approachBasedMinutes
  const maxConsecutiveHours = params.explicitSessionMinutes
    ? Math.max(1, Math.ceil(params.explicitSessionMinutes / 60))
    : params.studyApproach === 'corto'
      ? 3
      : 2

  const calendarConstraints = params.calendarData
    ? buildCalendarPlanningConstraints(params.calendarData)
    : { calendarStartTimesByDay: undefined, calendarEndTimesByDay: undefined, availabilityMap: {} }

  const response = await fetch('/api/study-planner/generate-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lessons: params.lessons,
      preferences: {
        days: uniqueDays,
        times: uniqueTimes,
        studyMode:
          params.studyApproach === 'corto'
            ? 'intensive'
            : params.studyApproach === 'largo'
              ? 'pomodoro'
              : 'balanced',
        maxConsecutiveHours,
        calendarStartTimesByDay: calendarConstraints.calendarStartTimesByDay,
        calendarEndTimesByDay: calendarConstraints.calendarEndTimesByDay,
        availabilityMap: calendarConstraints.availabilityMap,
        allowSunday,
      },
      deadlineDate,
      maxSessionMinutes,
    }),
  })

  if (!response.ok) {
    return { blockPlanGeneration: false, preCalculatedPlanContext: '' }
  }

  const payload = (await response.json()) as DeterministicPlanResponse

  if (payload.exceedsDeadline) {
    const validAlternatives = payload.validAlternatives ?? []
    return {
      blockPlanGeneration: true,
      preCalculatedPlanContext: [
        'BLOQUEO DE SEGURIDAD: Los horarios propuestos no cumplen la fecha limite.',
        `Fecha estimada de terminacion: ${payload.endDate ?? 'No disponible'}`,
        `Fecha limite del curso: ${payload.deadline ?? 'No disponible'}`,
        `Exceso estimado: ${payload.daysExcess ?? 0} dias`,
        '',
        'INSTRUCCION CRITICA PARA SofLIA:',
        `1. Informa que con los horarios "${uniqueDays.join(', ')} por la ${uniqueTimes.join(' y ')}" no se llega a tiempo.`,
        '2. No muestres ni inventes ninguna leccion fuera del plan validado.',
        '3. Propone directamente estas alternativas ya validadas:',
        buildAlternativesContext(validAlternatives),
        `4. Cada opcion ya fue calculada para terminar antes de ${payload.deadline ?? 'la fecha limite'}.`,
        '5. Pregunta cual opcion prefiere el usuario.',
        '6. Si el usuario elige una opcion, genera el plan inmediatamente con esos horarios.',
        `7. Datos estructurados de las alternativas:\n${JSON.stringify(validAlternatives)}`,
      ].join('\n'),
    }
  }

  if (!payload.plan) {
    return { blockPlanGeneration: false, preCalculatedPlanContext: '' }
  }

  return {
    blockPlanGeneration: false,
    preCalculatedPlanContext: [
      'PLAN PRECALCULADO VALIDADO:',
      payload.plan,
      '',
      'INSTRUCCION OBLIGATORIA PARA SofLIA:',
      '1. No recalcules este plan.',
      '2. Copia los horarios y las lecciones exactamente como aparecen arriba.',
      '3. Las lecciones secuenciales ya vienen agrupadas correctamente.',
      '4. Solo mejora el formato visual de la respuesta.',
    ].join('\n'),
  }
}
