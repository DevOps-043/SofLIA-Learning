import type { DifficultyAnalysis } from '../../../lib/rrweb/difficulty-pattern-detector'
import type { CourseLessonContext } from '../../../core/types/lia.types'
import type {
  LearnActivitySummary,
  LearnLesson,
  LearnModule,
  LearnTab,
} from '../components/learn/types'

function buildDifficultyDescription(
  pattern: DifficultyAnalysis['patterns'][number],
): string {
  switch (pattern.type) {
    case 'inactivity':
      return `Ha estado ${pattern.metadata?.inactivityDuration ? Math.floor(pattern.metadata.inactivityDuration / 60000) : 'varios'} minutos sin avanzar`
    case 'excessive_scroll':
      return 'Ha estado haciendo scroll repetidamente buscando información'
    case 'failed_attempts':
      return 'Ha intentado completar la actividad varias veces sin éxito'
    case 'frequent_deletion':
      return 'Ha estado escribiendo y borrando varias veces'
    case 'repetitive_cycles':
      return 'Ha estado yendo y viniendo entre diferentes secciones'
    case 'erroneous_clicks':
      return 'Ha hecho varios clicks sin resultado'
    default:
      return 'Está teniendo dificultades para avanzar'
  }
}

function buildSuggestedHelpType(
  analysis: DifficultyAnalysis,
  activeTab: LearnTab,
): string {
  const primaryPattern = analysis.patterns[0]
  if (!primaryPattern) {
    return 'general'
  }

  switch (primaryPattern.type) {
    case 'inactivity':
      return activeTab === 'activities'
        ? 'activity_guidance'
        : 'content_explanation'
    case 'excessive_scroll':
      return 'content_navigation'
    case 'failed_attempts':
      return 'activity_hints'
    case 'frequent_deletion':
      return 'activity_structure'
    case 'repetitive_cycles':
      return 'concept_clarification'
    case 'erroneous_clicks':
      return 'interface_guidance'
    default:
      return 'general'
  }
}

export function buildWorkshopHelpMessage(
  analysis: DifficultyAnalysis,
): string {
  const highSeverityPatterns = analysis.patterns.filter(
    (pattern) => pattern.severity === 'high',
  )
  const mediumSeverityPatterns = analysis.patterns.filter(
    (pattern) => pattern.severity === 'medium',
  )
  const primaryPattern =
    highSeverityPatterns[0] ||
    mediumSeverityPatterns[0] ||
    analysis.patterns[0]

  if (!primaryPattern) {
    return 'Necesito ayuda con esta lección'
  }

  const messageMap: Record<string, string> = {
    inactivity: 'Llevo varios minutos sin poder avanzar en esta lección',
    excessive_scroll:
      'Estoy buscando información en la lección pero no encuentro lo que necesito',
    failed_attempts:
      'He intentado completar la actividad varias veces pero no lo logro',
    frequent_deletion:
      'Estoy teniendo problemas para escribir la respuesta correcta',
    repetitive_cycles:
      'Estoy confundido y no sé cómo continuar con esta lección',
    erroneous_clicks:
      'He intentado varias opciones pero no consigo avanzar',
    back_navigation:
      'Necesito revisar contenido anterior porque no entiendo esta parte',
  }

  if (highSeverityPatterns.length > 1) {
    const mainIssue =
      messageMap[primaryPattern.type] ||
      'Estoy teniendo dificultades con esta lección'

    return `${mainIssue} y estoy un poco bloqueado`
  }

  return (
    messageMap[primaryPattern.type] || 'Necesito ayuda con esta lección'
  )
}

export function buildWorkshopEnrichedLessonContext(params: {
  lessonContext: CourseLessonContext | undefined
  analysis: DifficultyAnalysis
  behaviorAnalysis: string
  currentActivities: LearnActivitySummary[]
  activeTab: LearnTab
  currentLesson: LearnLesson | null
  modules: LearnModule[]
  userJobTitle?: string
}): CourseLessonContext | undefined {
  const {
    lessonContext,
    analysis,
    behaviorAnalysis,
    currentActivities,
    activeTab,
    currentLesson,
    modules,
    userJobTitle,
  } = params

  if (!lessonContext) {
    return undefined
  }

  const requiredActivities = currentActivities.filter(
    (activity) => activity.is_required,
  )
  const pendingRequired = requiredActivities.filter(
    (activity) => !activity.is_completed,
  )
  const completedActivities = currentActivities.filter(
    (activity) => activity.is_completed,
  )
  const currentActivityFocus =
    activeTab === 'activities' && pendingRequired.length > 0
      ? pendingRequired[0]
      : null

  const allLessons = modules.flatMap((module) => module.lessons)
  const currentLessonIndex = allLessons.findIndex(
    (lesson) => lesson.lesson_id === currentLesson?.lesson_id,
  )
  const progressPercentage =
    allLessons.length > 0
      ? Math.round(((currentLessonIndex + 1) / allLessons.length) * 100)
      : 0
  const verifiedLessonDurationMinutes =
    (lessonContext.totalDurationMinutes &&
    lessonContext.totalDurationMinutes > 0
      ? lessonContext.totalDurationMinutes
      : undefined) ||
    (currentLesson?.total_duration_minutes &&
    currentLesson.total_duration_minutes > 0
      ? currentLesson.total_duration_minutes
      : undefined) ||
    (currentLesson?.duration_seconds && currentLesson.duration_seconds > 0
      ? Math.ceil(currentLesson.duration_seconds / 60)
      : undefined)

  return {
    ...lessonContext,
    userRole: userJobTitle,
    activitiesContext: {
      totalActivities: currentActivities.length,
      requiredActivities: requiredActivities.length,
      completedActivities: completedActivities.length,
      pendingRequiredCount: pendingRequired.length,
      pendingRequiredTitles: pendingRequired
        .map((activity) => activity.activity_title)
        .join(', '),
      activityTypes: currentActivities.map((activity) => ({
        title: activity.activity_title,
        type: activity.activity_type,
        isRequired: activity.is_required,
        isCompleted: !!activity.is_completed,
      })),
      currentActivityFocus: currentActivityFocus
        ? {
            title: currentActivityFocus.activity_title,
            type: currentActivityFocus.activity_type,
            isRequired: currentActivityFocus.is_required,
            description:
              currentActivityFocus.activity_description || 'Sin descripción',
          }
        : null,
    },
    userBehaviorContext: behaviorAnalysis,
    learningProgressContext: {
      currentLessonNumber: currentLessonIndex + 1,
      totalLessons: allLessons.length,
      progressPercentage,
      currentTab: activeTab,
      timeInCurrentLesson: verifiedLessonDurationMinutes
        ? `${verifiedLessonDurationMinutes} minutos`
        : 'Desconocido',
    },
    difficultyDetected: {
      patterns: analysis.patterns.map((pattern) => ({
        type: pattern.type,
        severity: pattern.severity,
        description: buildDifficultyDescription(pattern),
      })),
      overallScore: analysis.overallScore,
      shouldIntervene: analysis.shouldIntervene,
      suggestedHelpType: buildSuggestedHelpType(analysis, activeTab),
    },
  }
}
