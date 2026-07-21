import type {
  BusinessUserAnalyticsResponse,
} from '@/features/business-panel/types/business-user-analytics.types'

// ─── Formatters ──────────────────────────────────────────────────────────────

export function fmtPercent(value: number, digits = 1): string {
  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value)}%`
}

export function fmtNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value)
}

export function fmtDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const h = Math.floor(total / 60)
  const m = total % 60

  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// ─── Performance badge ────────────────────────────────────────────────────────

export type PerformanceLevel = 'excellent' | 'good' | 'attention'

export function performanceLevel(score: number): PerformanceLevel {
  if (score >= 80) return 'excellent'
  if (score >= 50) return 'good'
  return 'attention'
}

export const PERFORMANCE_LABELS: Record<PerformanceLevel, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  attention: 'Necesita atención',
}

// Tailwind classes per level (bg + text).
export const PERFORMANCE_COLORS: Record<PerformanceLevel, { badge: string; text: string }> = {
  excellent: { badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', text: 'text-emerald-600 dark:text-emerald-400' },
  good:      { badge: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',       text: 'text-amber-600 dark:text-amber-400'   },
  attention: { badge: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',               text: 'text-red-600 dark:text-red-400'       },
}

// ─── Next goals computation ───────────────────────────────────────────────────

export interface DashboardGoal {
  id: string
  icon: 'book' | 'file' | 'target' | 'award'
  text: string
  cta: string
  href: string
  /** Optional 0-100 progress for course goals */
  progress?: number
}

export function computeGoals(
  data: BusinessUserAnalyticsResponse,
  orgSlug: string,
): DashboardGoal[] {
  const goals: DashboardGoal[] = []

  // 1. In-progress courses closest to completion (highest progress first)
  const inProgress = [...data.learning.courses]
    .filter((c) => c.progress > 0 && c.progress < 100)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2)

  for (const course of inProgress) {
    // Estimate remaining lessons via progress ratio
    const estimatedTotal =
      course.progress > 0
        ? Math.round(course.lessonsCompleted / (course.progress / 100))
        : 0
    const remaining = Math.max(0, estimatedTotal - course.lessonsCompleted)

    if (remaining > 0) {
      const shortTitle =
        course.courseTitle.length > 48
          ? `${course.courseTitle.slice(0, 48).trim()}…`
          : course.courseTitle

      goals.push({
        id: `course-${course.courseId}`,
        icon: 'book',
        text: `${remaining === 1 ? 'Falta 1 lección' : `Faltan ${remaining} lecciones`} para completar "${shortTitle}"`,
        cta: 'Continuar',
        href: `/${orgSlug}/my-courses`,
        progress: Math.round(course.progress),
      })
    }
  }

  // 2. Courses not started yet (progress = 0)
  const notStarted = data.learning.courses.filter((c) => c.progress === 0).slice(0, 1)
  for (const course of notStarted) {
    const shortTitle =
      course.courseTitle.length > 48
        ? `${course.courseTitle.slice(0, 48).trim()}…`
        : course.courseTitle
    goals.push({
      id: `start-${course.courseId}`,
      icon: 'book',
      text: `Aún no has comenzado "${shortTitle}"`,
      cta: 'Comenzar',
      href: `/${orgSlug}/my-courses`,
    })
  }

  // 3. Activities needing revision
  if (data.activities.needsRevision > 0) {
    const n = data.activities.needsRevision
    goals.push({
      id: 'activities-revision',
      icon: 'file',
      text: `${n === 1 ? '1 actividad pendiente de revisión' : `${n} actividades pendientes de revisión`}`,
      cta: n === 1 ? 'Resolver actividad' : 'Resolver actividades',
      href: `/${orgSlug}/my-courses`,
    })
  }

  // 4. Pending quizzes
  const pendingQuizzes = data.quizzes.lessonsWithQuiz - data.quizzes.quizzesTaken
  if (pendingQuizzes > 0) {
    goals.push({
      id: 'quizzes-pending',
      icon: 'target',
      text: `${pendingQuizzes === 1 ? '1 quiz pendiente' : `${pendingQuizzes} quizzes pendientes`} de presentar`,
      cta: pendingQuizzes === 1 ? 'Presentar quiz' : 'Presentar quizzes',
      href: `/${orgSlug}/my-courses`,
    })
  }

  // 5. Certificate almost earned (≥ 80% on a course without cert, not already listed)
  const nearCert = data.learning.courses.find(
    (c) =>
      c.progress >= 80 &&
      c.progress < 100 &&
      !c.hasCertificate &&
      !goals.some((g) => g.id === `course-${c.courseId}`),
  )
  if (nearCert) {
    const shortTitle =
      nearCert.courseTitle.length > 48
        ? `${nearCert.courseTitle.slice(0, 48).trim()}…`
        : nearCert.courseTitle
    goals.push({
      id: `cert-${nearCert.courseId}`,
      icon: 'award',
      text: `Estás al ${Math.round(nearCert.progress)}% de obtener tu certificado en "${shortTitle}"`,
      cta: 'Finalizar curso',
      href: `/${orgSlug}/my-courses`,
    })
  }

  return goals.slice(0, 5)
}

// ─── Total lessons estimate ───────────────────────────────────────────────────

/**
 * Estimates total lessons in the user's assignment scope by summing per-course
 * estimates (lessonsCompleted / (progress / 100)). Returns 0 if indeterminate.
 */
export function estimateTotalLessons(data: BusinessUserAnalyticsResponse): number {
  const courses = data.learning.courses
  if (courses.length === 0) return 0

  // Total REAL de lecciones publicadas sumando TODOS los cursos (incluidos los de 0%
  // de progreso). Antes se estimaba dividiendo lessonsCompleted/progreso, lo que dejaba
  // fuera del total los cursos sin progreso. Se conserva la estimación como respaldo
  // solo si un curso no trae `lessonsTotal`.
  let total = 0
  for (const c of courses) {
    if (c.lessonsTotal > 0) {
      total += c.lessonsTotal
    } else if (c.progress > 0 && c.lessonsCompleted > 0) {
      total += Math.round(c.lessonsCompleted / (c.progress / 100))
    } else {
      total += c.lessonsCompleted
    }
  }

  return total
}
