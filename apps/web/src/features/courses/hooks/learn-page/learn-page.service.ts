import type { CourseLessonContext } from '../../../../core/types/lia.types'
import type {
  LearnActivitySummary,
  LearnCourseData,
  LearnLesson,
  LearnMaterialSummary,
  LearnModule,
  LearnTab,
  LessonQuizStatus,
} from '../../components/learn/types'

interface WorkshopMetadataLessonPayload {
  lessonId: string
  lessonTitle: string
  lessonDescription?: string
  lessonOrderIndex: number
  durationSeconds?: number
}

interface WorkshopMetadataModulePayload {
  moduleId: string
  moduleTitle: string
  moduleDescription?: string
  moduleOrderIndex: number
  lessons: WorkshopMetadataLessonPayload[]
}

export interface WorkshopMetadataPayload {
  workshopId: string
  workshopTitle: string
  workshopDescription?: string
  modules: WorkshopMetadataModulePayload[]
}

function resolveVerifiedLessonDurationMinutes(
  lesson?: LearnLesson | null,
): number | undefined {
  if (!lesson) {
    return undefined
  }

  if (
    typeof lesson.total_duration_minutes === 'number' &&
    lesson.total_duration_minutes > 0
  ) {
    return lesson.total_duration_minutes
  }

  if (
    typeof lesson.duration_seconds === 'number' &&
    lesson.duration_seconds > 0
  ) {
    return Math.ceil(lesson.duration_seconds / 60)
  }

  return undefined
}

function buildActivitiesContext(params: {
  currentActivities?: LearnActivitySummary[]
  activeTab?: LearnTab
  currentActivityPrompts?: string[]
}): CourseLessonContext['activitiesContext'] {
  const { currentActivities, activeTab, currentActivityPrompts } = params

  if (!currentActivities) {
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
  const fallbackFocus = pendingRequired[0] || currentActivities[0] || null
  const shouldAttachPrompts =
    activeTab === 'activities' &&
    Array.isArray(currentActivityPrompts) &&
    currentActivityPrompts.length > 0

  return {
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
      description: activity.activity_description,
      isRequired: activity.is_required,
      isCompleted: !!activity.is_completed,
    })),
    currentActivityFocus:
      activeTab === 'activities' && fallbackFocus
        ? {
            title: fallbackFocus.activity_title,
            type: fallbackFocus.activity_type,
            isRequired: fallbackFocus.is_required,
            isCompleted: !!fallbackFocus.is_completed,
            description:
              fallbackFocus.activity_description || fallbackFocus.activity_title,
            prompts: shouldAttachPrompts ? currentActivityPrompts : undefined,
          }
        : null,
  }
}

function buildMaterialsContext(
  currentMaterials?: LearnMaterialSummary[],
): CourseLessonContext['materialsContext'] {
  if (!currentMaterials) {
    return undefined
  }

  const requiredMaterials = currentMaterials.filter((material) => material.is_required)

  return {
    totalMaterials: currentMaterials.length,
    requiredMaterials: requiredMaterials.length,
    materialTypes: currentMaterials.map((material) => ({
      title: material.material_title,
      type: material.material_type,
      description: material.material_description,
      isRequired: !!material.is_required,
    })),
  }
}

function buildQuizContext(
  quizStatus?: LessonQuizStatus | null,
): CourseLessonContext['quizContext'] {
  if (quizStatus === undefined) {
    return undefined
  }

  if (!quizStatus) {
    return {
      hasRequiredQuizzes: false,
      totalRequiredQuizzes: 0,
      completedQuizzes: 0,
      passedQuizzes: 0,
      allQuizzesPassed: true,
      quizzes: [],
    }
  }

  return {
    hasRequiredQuizzes: quizStatus.hasRequiredQuizzes,
    totalRequiredQuizzes: quizStatus.totalRequiredQuizzes,
    completedQuizzes: quizStatus.completedQuizzes,
    passedQuizzes: quizStatus.passedQuizzes,
    allQuizzesPassed: quizStatus.allQuizzesPassed,
    quizzes: quizStatus.quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      type: quiz.type,
      isCompleted: quiz.isCompleted,
      isPassed: quiz.isPassed,
      percentage: quiz.percentage,
    })),
  }
}

function buildLearningProgressContext(params: {
  modules: LearnModule[]
  currentLesson: LearnLesson
  activeTab?: LearnTab
}): CourseLessonContext['learningProgressContext'] {
  const { modules, currentLesson, activeTab } = params
  const allLessons = modules.flatMap((module) => module.lessons)
  const currentLessonIndex = allLessons.findIndex(
    (lesson) => lesson.lesson_id === currentLesson.lesson_id,
  )
  const verifiedLessonDurationMinutes =
    resolveVerifiedLessonDurationMinutes(currentLesson)

  return {
    currentLessonNumber: currentLessonIndex >= 0 ? currentLessonIndex + 1 : 1,
    totalLessons: allLessons.length,
    progressPercentage:
      allLessons.length > 0 && currentLessonIndex >= 0
        ? Math.round(((currentLessonIndex + 1) / allLessons.length) * 100)
        : 0,
    currentTab: activeTab || 'video',
    timeInCurrentLesson: verifiedLessonDurationMinutes
      ? `${verifiedLessonDurationMinutes} minutos`
      : 'Desconocido',
  }
}

export function buildLearnDataQuery(params: {
  lessonId?: string | null
  language: string
  organizationId?: string | null
}): string {
  const queryParams = new URLSearchParams()

  if (params.lessonId) {
    queryParams.append('lessonId', params.lessonId)
  }

  queryParams.append('language', params.language)

  if (params.organizationId) {
    queryParams.append('orgId', params.organizationId)
  }

  const queryString = queryParams.toString()
  return queryString ? `?${queryString}` : ''
}

export function calculateCourseProgress(modules: LearnModule[]): number {
  const allLessons = modules.flatMap((module) => module.lessons)
  const completedLessons = allLessons.filter((lesson) => lesson.is_completed)

  if (allLessons.length === 0) {
    return 0
  }

  return Math.round((completedLessons.length / allLessons.length) * 100)
}

export function resolveCurrentLesson(
  modules: LearnModule[],
  lastWatchedLessonId?: string | null,
): LearnLesson | null {
  const allLessons = modules.flatMap((module) => module.lessons)
  if (allLessons.length === 0) {
    return null
  }

  if (lastWatchedLessonId) {
    const lastWatchedLesson = allLessons.find(
      (lesson) => lesson.lesson_id === lastWatchedLessonId,
    )

    if (lastWatchedLesson) {
      return lastWatchedLesson
    }
  }

  return allLessons.find((lesson) => !lesson.is_completed) || allLessons[0]
}

export function buildWorkshopMetadataContext(params: {
  metadata: WorkshopMetadataPayload
  slug: string
  userJobTitle?: string
}): CourseLessonContext {
  const { metadata, slug, userJobTitle } = params

  return {
    contextType: 'workshop',
    courseId: metadata.workshopId,
    courseSlug: slug,
    courseTitle: metadata.workshopTitle,
    courseDescription: metadata.workshopDescription,
    allModules: metadata.modules.map((module) => ({
      moduleId: module.moduleId,
      moduleTitle: module.moduleTitle,
      moduleDescription: module.moduleDescription,
      moduleOrderIndex: module.moduleOrderIndex,
      lessons: module.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        lessonTitle: lesson.lessonTitle,
        lessonDescription: lesson.lessonDescription,
        lessonOrderIndex: lesson.lessonOrderIndex,
        durationSeconds: lesson.durationSeconds,
      })),
    })),
    userRole: userJobTitle,
  }
}

export function buildLearnLessonContext(params: {
  course: LearnCourseData | null
  currentLesson: LearnLesson | null
  modules: LearnModule[]
  workshopMetadata: CourseLessonContext | null
  slug: string
  userJobTitle?: string
  transcriptContent?: string | null
  summaryContent?: string | null
  activeTab?: LearnTab
  currentPage?: string
  currentActivities?: LearnActivitySummary[]
  currentMaterials?: LearnMaterialSummary[]
  quizStatus?: LessonQuizStatus | null
  currentActivityPrompts?: string[]
}): CourseLessonContext | undefined {
  const {
    course,
    currentLesson,
    modules,
    workshopMetadata,
    slug,
    userJobTitle,
    transcriptContent,
    summaryContent,
    activeTab,
    currentPage,
    currentActivities,
    currentMaterials,
    quizStatus,
    currentActivityPrompts,
  } = params

  if (!course || !currentLesson) {
    return undefined
  }

  const currentModule = modules.find((module) =>
    module.lessons.some((lesson) => lesson.lesson_id === currentLesson.lesson_id),
  )
  const verifiedLessonTotalDurationMinutes =
    resolveVerifiedLessonDurationMinutes(currentLesson)

  const baseContext: CourseLessonContext = workshopMetadata
    ? {
        ...workshopMetadata,
        moduleId: currentModule?.module_id,
        moduleTitle: currentModule?.module_title,
        lessonId: currentLesson.lesson_id,
        lessonTitle: currentLesson.lesson_title,
        lessonDescription: currentLesson.lesson_description,
        durationSeconds: currentLesson.duration_seconds,
        totalDurationMinutes: verifiedLessonTotalDurationMinutes,
        userRole: userJobTitle,
      }
    : {
        contextType: 'course',
        courseId: course.id || course.course_id || undefined,
        courseSlug: slug || undefined,
        courseTitle: course.title || course.course_title,
        courseDescription: course.description || course.course_description,
        moduleId: currentModule?.module_id,
        moduleTitle: currentModule?.module_title,
        lessonId: currentLesson.lesson_id,
        lessonTitle: currentLesson.lesson_title,
        lessonDescription: currentLesson.lesson_description,
        durationSeconds: currentLesson.duration_seconds,
        totalDurationMinutes: verifiedLessonTotalDurationMinutes,
        userRole: userJobTitle,
      }

  const activitiesContext = buildActivitiesContext({
    currentActivities,
    activeTab,
    currentActivityPrompts,
  })
  const materialsContext = buildMaterialsContext(currentMaterials)
  const quizContext = buildQuizContext(quizStatus)
  const learningProgressContext = buildLearningProgressContext({
    modules,
    currentLesson,
    activeTab,
  })

  return {
    ...baseContext,
    transcriptContent: transcriptContent || undefined,
    summaryContent: summaryContent || undefined,
    currentPage,
    currentTab: activeTab,
    activitiesContext,
    materialsContext,
    quizContext,
    learningProgressContext,
  }
}
