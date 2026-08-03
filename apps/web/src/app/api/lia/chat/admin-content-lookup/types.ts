import type { MentionIdentifiers } from '../admin-lookup-shared/mention-matching'

/**
 * Tipos del módulo de consulta de contenido (cursos y rutas) para SofLIA.
 *
 * Responde a lo que un administrador pregunta sobre el catálogo: qué cursos
 * existen, cómo está montado uno por dentro (módulos, lecciones, actividades),
 * cuánta gente lo hace, cuántos lo terminan y —lo más accionable— EN QUÉ LECCIÓN
 * se queda atascada la gente.
 *
 * Alcance: el superadmin ve cualquier curso con sus cifras de toda la
 * plataforma; un owner/admin de organización ve solo los cursos de su empresa y
 * con las cifras de su empresa (el alcance lo fija el grant, ver
 * `../superadmin/authorization`).
 */

export type ContentLookupIdentifiers = MentionIdentifiers

export interface CourseCatalogEntry {
  id: string
  title: string
  slug: string | null
}

export interface LearningPathCatalogEntry {
  id: string
  title: string
  slug: string | null
}

/** Catálogo de detección de menciones: cursos y rutas del alcance del actor. */
export interface ContentCatalog {
  courses: CourseCatalogEntry[]
  learningPaths: LearningPathCatalogEntry[]
}

export interface CourseProfile {
  id: string
  title: string
  slug: string | null
  description: string | null
  category: string | null
  level: string | null
  durationMinutes: number
  isActive: boolean
  approvalStatus: string | null
  averageRating: number
  reviewCount: number
  createdAt: string | null
  updatedAt: string | null
  instructorName: string | null
  learningObjectives: string[]
}

export interface CourseModuleSummary {
  title: string
  orderIndex: number
  isPublished: boolean
  isRequired: boolean
  durationMinutes: number
  lessonCount: number
}

/** Lección con su recorrido real: cuánta gente la empieza y cuánta la termina. */
export interface CourseLessonSummary {
  lessonId: string
  title: string
  moduleTitle: string
  moduleOrderIndex: number
  orderIndex: number
  durationMinutes: number
  isPublished: boolean
  activityCount: number
  usersStarted: number
  usersCompleted: number
}

export interface CourseStructure {
  modules: CourseModuleSummary[]
  totalModules: number
  totalLessons: number
  publishedLessons: number
  totalActivities: number
  activitiesByType: Array<{ type: string; count: number }>
  totalDurationMinutes: number
  /** true si el curso tiene más lecciones de las que se leyeron. */
  truncated: boolean
}

export interface CourseAdoption {
  enrolledUsers: number
  completedUsers: number
  averageProgressPercentage: number
  completionRatePercentage: number
  firstEnrollmentAt: string | null
  lastAccessedAt: string | null
  certificatesIssued: number
  /** true si se alcanzó el tope de inscripciones leídas. */
  truncated: boolean
}

/**
 * Punto de fuga del curso: dónde cae más gente respecto a la lección anterior.
 * Es la métrica que convierte "el curso va mal" en "el curso va mal AQUÍ".
 */
export interface CourseDropoff {
  lessons: CourseLessonSummary[]
  bottleneckLessonTitle: string | null
  bottleneckDropPercentage: number | null
}

/** Uso del curso por organización. Solo tiene sentido en alcance de plataforma. */
export interface CourseOrganizationUsage {
  organizationName: string
  enrolledUsers: number
  averageProgressPercentage: number
}

export interface CourseDossier {
  profile: CourseProfile
  structure: CourseStructure
  adoption: CourseAdoption
  dropoff: CourseDropoff
  organizations: CourseOrganizationUsage[]
  /** Títulos de las rutas de aprendizaje que incluyen este curso. */
  inLearningPaths: string[]
}

export interface LearningPathDossier {
  title: string
  slug: string | null
  description: string | null
  isActive: boolean
  createdAt: string | null
  courses: Array<{ position: number; courseTitle: string; isActive: boolean }>
  /** Organizaciones con la ruta asignada. Solo en alcance de plataforma. */
  organizationsAssigned: number | null
  usersWithProgress: number
  usersCompleted: number
  averageProgressPercentage: number
}

/** Índice del catálogo (solo superadmin): visión general sin nombrar nada. */
export interface ContentIndex {
  courses: Array<{
    title: string
    slug: string | null
    category: string | null
    level: string | null
    durationMinutes: number
    isActive: boolean
    approvalStatus: string | null
    studentCount: number
    averageRating: number
  }>
  learningPaths: Array<{
    title: string
    slug: string | null
    courseCount: number
    isActive: boolean
  }>
  truncated: boolean
}

/** Candidato mostrado cuando hay demasiadas coincidencias que desambiguar. */
export interface ContentCandidate {
  kind: 'course' | 'learning-path'
  title: string
  slug: string | null
}

export interface ContentLookupResult {
  scope: 'platform' | 'organization'
  courseDossiers: CourseDossier[]
  learningPathDossiers: LearningPathDossier[]
  ambiguousCandidates: ContentCandidate[]
  searchedWithoutMatches: boolean
  catalogIndex: ContentIndex | null
}

/** Máximo de dossiers completos inyectados por turno (tamaño de prompt). */
export const MAX_CONTENT_DOSSIERS_PER_TURN = 2

/** Máximo de coincidencias listadas al pedir desambiguación. */
export const MAX_AMBIGUOUS_CONTENT = 6

/** Topes del catálogo de detección de menciones. */
export const MAX_CATALOG_COURSES = 400
export const MAX_CATALOG_LEARNING_PATHS = 200

/** Topes del índice de catálogo mostrado al superadmin. */
export const MAX_INDEXED_COURSES = 30
export const MAX_INDEXED_LEARNING_PATHS = 15

/** Topes de lectura por dossier de curso. */
export const MAX_COURSE_MODULES = 40
export const MAX_COURSE_LESSONS = 200
export const MAX_COURSE_ACTIVITY_ROWS = 1000
export const MAX_COURSE_ENROLLMENT_ROWS = 3000
export const MAX_LESSON_PROGRESS_ROWS = 6000

/** Lecciones detalladas en el análisis de abandono. */
export const MAX_DROPOFF_LESSONS = 20

/** Organizaciones listadas como usuarias de un curso. */
export const MAX_COURSE_ORGANIZATIONS = 10
