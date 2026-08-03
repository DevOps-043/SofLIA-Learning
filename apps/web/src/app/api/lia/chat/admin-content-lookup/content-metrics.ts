import type {
  CourseAdoption,
  CourseDropoff,
  CourseLessonSummary,
  CourseModuleSummary,
  CourseOrganizationUsage,
  CourseStructure,
} from './types'
import { MAX_COURSE_ORGANIZATIONS, MAX_DROPOFF_LESSONS } from './types'

/**
 * Agregaciones del dossier de contenido. Funciones PURAS: reciben filas ya
 * leídas y devuelven las métricas listas para el prompt.
 *
 * Aquí vive la parte con reglas de negocio reales (qué cuenta como completado,
 * cómo se localiza el punto de abandono de un curso), separada del acceso a
 * datos para poder cubrirla con tests sin tocar la base de datos.
 */

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10
}

function latestIso(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return a >= b ? a : b
}

function earliestIso(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return a <= b ? a : b
}

export interface ModuleRow {
  moduleId: string
  title: string
  orderIndex: number
  isPublished: boolean
  isRequired: boolean
  durationMinutes: number
}

export interface LessonRow {
  lessonId: string
  moduleId: string
  title: string
  orderIndex: number
  durationMinutes: number
  isPublished: boolean
}

export interface ActivityRow {
  lessonId: string
  activityType: string | null
}

export interface LessonProgressRow {
  lessonId: string
  userId: string
  startedAt: string | null
  isCompleted: boolean
}

/**
 * Estructura del curso tal como la ve un administrador: módulos con su número
 * de lecciones, y el recuento de actividades por tipo (que es lo que distingue
 * un curso de vídeo pasivo de uno con trabajo real).
 */
export function summarizeCourseStructure(params: {
  modules: ModuleRow[]
  lessons: LessonRow[]
  activities: ActivityRow[]
  truncated: boolean
}): CourseStructure {
  const { modules, lessons, activities, truncated } = params

  const lessonsByModule = new Map<string, LessonRow[]>()
  for (const lesson of lessons) {
    const current = lessonsByModule.get(lesson.moduleId) ?? []
    current.push(lesson)
    lessonsByModule.set(lesson.moduleId, current)
  }

  const activityCountByType = new Map<string, number>()
  for (const activity of activities) {
    const type = activity.activityType?.trim() || 'sin tipo'
    activityCountByType.set(type, (activityCountByType.get(type) ?? 0) + 1)
  }

  const moduleSummaries: CourseModuleSummary[] = [...modules]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((module) => ({
      title: module.title,
      orderIndex: module.orderIndex,
      isPublished: module.isPublished,
      isRequired: module.isRequired,
      durationMinutes: module.durationMinutes,
      lessonCount: lessonsByModule.get(module.moduleId)?.length ?? 0,
    }))

  return {
    modules: moduleSummaries,
    totalModules: modules.length,
    totalLessons: lessons.length,
    publishedLessons: lessons.filter((lesson) => lesson.isPublished).length,
    totalActivities: activities.length,
    activitiesByType: Array.from(activityCountByType.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count),
    totalDurationMinutes: lessons.reduce(
      (sum, lesson) => sum + (lesson.durationMinutes || 0),
      0,
    ),
    truncated,
  }
}

export interface EnrollmentRow {
  userId: string
  organizationId: string | null
  status: string | null
  progressPercentage: number
  enrolledAt: string | null
  completedAt: string | null
  lastAccessedAt: string | null
}

function isCompletedEnrollment(enrollment: EnrollmentRow): boolean {
  return (
    Boolean(enrollment.completedAt) ||
    (enrollment.status ?? '').toLowerCase() === 'completed'
  )
}

export function summarizeCourseAdoption(params: {
  enrollments: EnrollmentRow[]
  certificatesIssued: number
  truncated: boolean
}): CourseAdoption {
  const { enrollments, certificatesIssued, truncated } = params

  const enrolledUsers = new Set(enrollments.map((row) => row.userId))
  const completedUsers = new Set(
    enrollments.filter(isCompletedEnrollment).map((row) => row.userId),
  )

  let progressSum = 0
  let firstEnrollmentAt: string | null = null
  let lastAccessedAt: string | null = null
  for (const enrollment of enrollments) {
    progressSum += enrollment.progressPercentage
    firstEnrollmentAt = earliestIso(firstEnrollmentAt, enrollment.enrolledAt)
    lastAccessedAt = latestIso(lastAccessedAt, enrollment.lastAccessedAt)
  }

  return {
    enrolledUsers: enrolledUsers.size,
    completedUsers: completedUsers.size,
    averageProgressPercentage:
      enrollments.length > 0 ? roundToOneDecimal(progressSum / enrollments.length) : 0,
    completionRatePercentage:
      enrolledUsers.size > 0
        ? roundToOneDecimal((completedUsers.size / enrolledUsers.size) * 100)
        : 0,
    firstEnrollmentAt,
    lastAccessedAt,
    certificatesIssued,
    truncated,
  }
}

/**
 * Reparto del curso por organización. Solo se usa en alcance de plataforma:
 * responde "¿qué empresas están usando este curso y cómo les va?".
 */
export function summarizeCourseOrganizations(params: {
  enrollments: EnrollmentRow[]
  organizationNamesById: Map<string, string>
}): CourseOrganizationUsage[] {
  const byOrganization = new Map<
    string,
    { users: Set<string>; progressSum: number; progressCount: number }
  >()

  for (const enrollment of params.enrollments) {
    if (!enrollment.organizationId) continue
    const current = byOrganization.get(enrollment.organizationId) ?? {
      users: new Set<string>(),
      progressSum: 0,
      progressCount: 0,
    }
    current.users.add(enrollment.userId)
    current.progressSum += enrollment.progressPercentage
    current.progressCount += 1
    byOrganization.set(enrollment.organizationId, current)
  }

  return Array.from(byOrganization.entries())
    .map(([organizationId, aggregate]) => ({
      organizationName:
        params.organizationNamesById.get(organizationId) ?? 'organización desconocida',
      enrolledUsers: aggregate.users.size,
      averageProgressPercentage: roundToOneDecimal(
        aggregate.progressSum / aggregate.progressCount,
      ),
    }))
    .sort((a, b) => b.enrolledUsers - a.enrolledUsers)
    .slice(0, MAX_COURSE_ORGANIZATIONS)
}

/**
 * Recorrido real del curso, lección a lección, y localización del cuello de
 * botella.
 *
 * El "punto de fuga" es la lección con la mayor caída porcentual de personas que
 * la INICIAN respecto a la lección inmediatamente anterior del recorrido. Se
 * ignoran las lecciones sin tráfico previo (no se puede abandonar algo que nadie
 * había empezado) y las caídas de muestras minúsculas, que solo darían ruido.
 */
export function analyzeCourseDropoff(params: {
  modules: ModuleRow[]
  lessons: LessonRow[]
  activities: ActivityRow[]
  progress: LessonProgressRow[]
}): CourseDropoff {
  const moduleById = new Map(params.modules.map((module) => [module.moduleId, module]))

  const activityCountByLesson = new Map<string, number>()
  for (const activity of params.activities) {
    activityCountByLesson.set(
      activity.lessonId,
      (activityCountByLesson.get(activity.lessonId) ?? 0) + 1,
    )
  }

  const startedByLesson = new Map<string, Set<string>>()
  const completedByLesson = new Map<string, Set<string>>()
  for (const row of params.progress) {
    if (row.startedAt) {
      const started = startedByLesson.get(row.lessonId) ?? new Set<string>()
      started.add(row.userId)
      startedByLesson.set(row.lessonId, started)
    }
    if (row.isCompleted) {
      const completed = completedByLesson.get(row.lessonId) ?? new Set<string>()
      completed.add(row.userId)
      completedByLesson.set(row.lessonId, completed)
    }
  }

  const ordered: CourseLessonSummary[] = [...params.lessons]
    .map((lesson) => {
      const module = moduleById.get(lesson.moduleId)
      return {
        lessonId: lesson.lessonId,
        title: lesson.title,
        moduleTitle: module?.title ?? 'módulo desconocido',
        moduleOrderIndex: module?.orderIndex ?? 0,
        orderIndex: lesson.orderIndex,
        durationMinutes: lesson.durationMinutes,
        isPublished: lesson.isPublished,
        activityCount: activityCountByLesson.get(lesson.lessonId) ?? 0,
        usersStarted: startedByLesson.get(lesson.lessonId)?.size ?? 0,
        usersCompleted: completedByLesson.get(lesson.lessonId)?.size ?? 0,
      }
    })
    .sort(
      (a, b) => a.moduleOrderIndex - b.moduleOrderIndex || a.orderIndex - b.orderIndex,
    )

  // Muestra mínima para no señalar como cuello de botella una caída de 2 a 1.
  const MIN_PREVIOUS_USERS = 3

  let bottleneckLessonTitle: string | null = null
  let bottleneckDropPercentage: number | null = null

  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1]
    const current = ordered[index]
    if (previous.usersStarted < MIN_PREVIOUS_USERS) continue

    const drop =
      ((previous.usersStarted - current.usersStarted) / previous.usersStarted) * 100
    if (drop <= 0) continue

    if (bottleneckDropPercentage === null || drop > bottleneckDropPercentage) {
      bottleneckDropPercentage = roundToOneDecimal(drop)
      bottleneckLessonTitle = current.title
    }
  }

  return {
    lessons: ordered.slice(0, MAX_DROPOFF_LESSONS),
    bottleneckLessonTitle,
    bottleneckDropPercentage,
  }
}
