import type { CourseLessonContext } from '@/core/types/lia.types'
import { SofLIAPersonalizationService } from '@/core/services/lia-personalization.service'
import { SofLIAContextService } from '@/features/study-planner/services/lia-context.service'
import type { ResolvedOrganizationAiContext } from '@/lib/lia-context/services/organization-ai-context.service'
import { logger } from '@/lib/utils/logger'
import { getContextPrompt, type PageContext } from '../system-prompt.service'
import { validateProposedSchedule } from './calendar-validation.service'
import type { SupportedLanguage } from './language-detection.service'
import {
  buildDefaultProposedSlots,
  detectScheduleChangeRequest,
  detectStudyScheduleConfig,
} from './study-schedule.service'

type PendingLesson = {
  moduleTitle: string
  lessonTitle: string
  courseTitle: string
  durationMinutes?: number
}

type StudyPlannerPageUserContext = NonNullable<PageContext['userContext']> & {
  pendingLessonsWithNames?: PendingLesson[]
  targetDate?: string
  totalPendingLessons?: number
}

interface AuthenticatedUser {
  id: string
}

interface BuildAiChatContextParams {
  user?: AuthenticatedUser | null
  message: string
  context: string
  language: SupportedLanguage
  displayName: string
  userRole?: string
  userRoleDescription?: string
  organizationAiContext?: ResolvedOrganizationAiContext | null
  courseContext?: CourseLessonContext
  workshopContext?: CourseLessonContext
  pageContext?: PageContext
  isFirstMessage: boolean
  isPromptMode: boolean
  requestOrigin: string
}

export interface BuildAiChatContextResult {
  effectiveContext: string
  effectiveLanguage: SupportedLanguage
  contextPrompt: string
}

function buildPendingLessonsPrompt(
  pendingLessons: PendingLesson[],
  totalPendingLessons: number,
) {
  const lessonsByModule: Record<string, PendingLesson[]> = {}

  pendingLessons.forEach((lesson) => {
    if (!lessonsByModule[lesson.moduleTitle]) {
      lessonsByModule[lesson.moduleTitle] = []
    }

    lessonsByModule[lesson.moduleTitle].push(lesson)
  })

  let prompt =
    `\n\nLECCIONES PENDIENTES DEL CURSO (${totalPendingLessons} total):\n` +
    'IMPORTANTE: Usa estos nombres EXACTOS al generar el plan de estudios. ' +
    'NUNCA uses "Sesion 1, 2, 3...".\n\n'

  Object.entries(lessonsByModule).forEach(([moduleTitle, lessons]) => {
    prompt += `${moduleTitle}:\n`
    lessons.forEach((lesson, index) => {
      const durationSuffix = lesson.durationMinutes
        ? ` (${lesson.durationMinutes} min base)`
        : ''
      prompt += `   ${index + 1}. ${lesson.lessonTitle}${durationSuffix}\n`
    })
    prompt += '\n'
  })

  prompt +=
    '\nINSTRUCCION: Al generar horarios, usa EXACTAMENTE los nombres de ' +
    'lecciones listados arriba y CALCULA LA DURACION FINAL usando el ' +
    'multiplicador seleccionado.\n'
  prompt +=
    'Ejemplo: Si la leccion dice "(30 min base)" y el multiplicador es 1.4, ' +
    'el bloque dura 42 min (ej: 10:00 - 10:42).\n'

  return prompt
}

function buildPreCalculatedLessons(
  pendingLessons: PendingLesson[],
) {
  return pendingLessons.map((lesson, index) => {
    const lessonMatch = lesson.lessonTitle.match(
      /(?:Leccion|Lección)\s*(\d+(?:\.\d+)?)/i,
    )

    return {
      lessonTitle: lesson.lessonTitle,
      lessonOrderIndex: lessonMatch ? parseFloat(lessonMatch[1]) : index + 1,
      moduleTitle: lesson.moduleTitle,
      durationMinutes: lesson.durationMinutes || 15,
    }
  })
}

async function buildStudyPlannerPrompt(
  userId: string,
  message: string,
  pageContext?: PageContext,
) {
  const studyPlannerUserContext = pageContext?.userContext as
    | StudyPlannerPageUserContext
    | undefined

  if (
    !studyPlannerUserContext ||
    !Array.isArray(studyPlannerUserContext.pendingLessonsWithNames) ||
    studyPlannerUserContext.pendingLessonsWithNames.length === 0
  ) {
    return ''
  }

  const pendingLessons = studyPlannerUserContext.pendingLessonsWithNames
  const totalPendingLessons =
    studyPlannerUserContext.totalPendingLessons || pendingLessons.length

  let prompt = buildPendingLessonsPrompt(pendingLessons, totalPendingLessons)
  const scheduleConfig = detectStudyScheduleConfig(message)

  if (!scheduleConfig.detected) {
    return prompt
  }

  const targetDate = studyPlannerUserContext.targetDate
    ? new Date(studyPlannerUserContext.targetDate)
    : undefined

  const preCalculatedPlan = SofLIAContextService.preCalculateStudySessions(
    buildPreCalculatedLessons(pendingLessons),
    {
      studyDays: scheduleConfig.studyDays,
      timeSlots: scheduleConfig.timeSlots,
      startDate: new Date(),
      targetDate,
    },
  )

  if (preCalculatedPlan.sessions.length === 0) {
    return prompt
  }

  prompt += SofLIAContextService.formatPreCalculatedSessionsForPrompt(
    preCalculatedPlan,
  )
  prompt += '\n\nINSTRUCCION CRITICA PARA SofLIA\n'
  prompt += 'El plan de arriba ya esta COMPLETAMENTE CALCULADO.\n'
  prompt += '- Las horas de fin son EXACTAS.\n'
  prompt += '- Las lecciones decimales ya estan AGRUPADAS correctamente.\n'
  prompt += '- El numero de semanas es CORRECTO.\n'
  prompt += `- Los dias son EXACTAMENTE los que el usuario pidio: ${scheduleConfig.studyDays.join(', ')}\n`
  prompt +=
    '\nTU TRABAJO: Presenta este plan tal cual, con buen formato. NO recalcules NADA.\n'
  prompt +=
    'Si modificas las horas o los dias, ESTARAS COMETIENDO UN ERROR.\n'

  logger.info('[AI-CHAT] Plan de estudio precalculado agregado al prompt', {
    userId,
    sessionsCount: preCalculatedPlan.sessions.length,
  })

  return prompt
}

async function buildStudyPlannerContextString(userId: string) {
  try {
    const studyPlannerContext =
      await SofLIAContextService.buildStudyPlannerContext(userId)

    return SofLIAContextService.formatContextForPrompt(studyPlannerContext)
  } catch (error) {
    logger.error('Error construyendo contexto del planificador:', error)
    return ''
  }
}

async function buildScheduleValidationPrompt(
  userId: string,
  message: string,
  requestOrigin: string,
) {
  const scheduleChangeRequest = detectScheduleChangeRequest(message)

  if (!scheduleChangeRequest.isScheduleChange) {
    return ''
  }

  const validation = await validateProposedSchedule({
    userId,
    proposedSlots: buildDefaultProposedSlots(scheduleChangeRequest.proposedTime),
    origin: requestOrigin,
  })

  if (!validation.hasConflicts) {
    return '\n\nVALIDACION: Los horarios propuestos estan disponibles.\n'
  }

  let prompt = '\n\nCONFLICTOS DETECTADOS:\n'
  validation.conflicts.forEach((conflict) => {
    prompt += `- ${conflict.date} a las ${conflict.time}: ${conflict.event}\n`
  })

  prompt +=
    '\nINSTRUCCION IMPORTANTE: ADVIERTE al usuario sobre estos conflictos con eventos existentes.\n'
  prompt += 'NO rechaces el cambio completamente. En su lugar:\n'
  prompt += '1. Muestra claramente los eventos que se solapan\n'
  prompt += '2. Pregunta si desea continuar de todos modos\n'
  prompt += '3. Sugiere horarios alternativos que esten libres\n'

  return prompt
}

async function buildPersonalizationPrompt(userId: string) {
  try {
    const settings = await SofLIAPersonalizationService.getSettings(userId)

    if (!settings) {
      return ''
    }

    return SofLIAPersonalizationService.buildPersonalizationPrompt(settings)
  } catch (error) {
    logger.warn('Error cargando personalizacion de SofLIA:', error)
    return ''
  }
}

export async function buildAiChatContext({
  user,
  message,
  context,
  language,
  displayName,
  userRole,
  userRoleDescription,
  organizationAiContext,
  courseContext,
  workshopContext,
  pageContext,
  isFirstMessage,
  isPromptMode,
  requestOrigin,
}: BuildAiChatContextParams): Promise<BuildAiChatContextResult> {
  const effectiveContext = isPromptMode ? 'prompts' : context
  const effectiveLanguage =
    effectiveContext === 'study-planner' ||
    effectiveContext === 'study-planner-availability'
      ? 'es'
      : language

  const studyPlannerContextString =
    effectiveContext === 'study-planner' && user
      ? await buildStudyPlannerContextString(user.id)
      : ''

  let contextPrompt = getContextPrompt(
    effectiveContext,
    displayName,
    courseContext,
    workshopContext,
    pageContext,
    userRole,
    effectiveLanguage,
    isFirstMessage,
    studyPlannerContextString,
    userRoleDescription,
    organizationAiContext,
  )

  if (context === 'study-planner' && user) {
    contextPrompt += await buildScheduleValidationPrompt(
      user.id,
      message,
      requestOrigin,
    )
    contextPrompt += await buildStudyPlannerPrompt(user.id, message, pageContext)
  }

  if (user) {
    contextPrompt += await buildPersonalizationPrompt(user.id)
  }

  return {
    effectiveContext,
    effectiveLanguage,
    contextPrompt,
  }
}
