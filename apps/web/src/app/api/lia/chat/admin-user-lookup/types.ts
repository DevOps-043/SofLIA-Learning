/**
 * Tipos del módulo de consulta global de usuarios para SofLIA (solo superadmin).
 *
 * El dossier agrega la información verificada de un usuario de la plataforma
 * (perfil, organizaciones, progreso, actividad) para inyectarla como contexto
 * del system prompt cuando el usuario autenticado es Admin de plataforma.
 */

export interface AdminLookupIdentifiers {
  emails: string[]
  userIds: string[]
  names: string[]
}

export interface AdminUserProfile {
  id: string
  username: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  displayName: string | null
  platformRole: string | null
  isBanned: boolean
  banReason: string | null
  emailVerified: boolean
  createdAt: string | null
  lastLoginAt: string | null
  lastActivityAt: string | null
}

export interface AdminUserOrganizationMembership {
  organizationName: string | null
  organizationSlug: string | null
  role: string | null
  status: string | null
  jobTitle: string | null
  joinedAt: string | null
}

export interface AdminUserEnrollment {
  courseTitle: string | null
  status: string | null
  progressPercentage: number
  enrolledAt: string | null
  startedAt: string | null
  completedAt: string | null
  lastAccessedAt: string | null
  hasCertificate: boolean
  certificateIssuedAt: string | null
}

export interface AdminUserLessonStats {
  totalLessonsTouched: number
  completedLessons: number
  totalStudyMinutes: number
  quizzesPassed: number
  recentCompletedLessons: Array<{
    lessonTitle: string | null
    completedAt: string | null
  }>
}

export interface AdminUserLearningPathProgress {
  learningPathTitle: string | null
  status: string | null
  progressPercentage: number
  completedItems: number
  totalItems: number
}

export interface AdminUserLiaUsage {
  conversationCount: number
  lastConversationAt: string | null
}

export interface AdminUserStudyPlanSummary {
  name: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string | null
}

export interface AdminUserDossier {
  profile: AdminUserProfile
  organizations: AdminUserOrganizationMembership[]
  enrollments: AdminUserEnrollment[]
  lessonStats: AdminUserLessonStats
  learningPaths: AdminUserLearningPathProgress[]
  liaUsage: AdminUserLiaUsage
  studyPlans: AdminUserStudyPlanSummary[]
}

/**
 * Candidato de una búsqueda. Lleva la organización porque es el dato que
 * permite al admin distinguir entre homónimos ("¿la María Domenzain de Acme o
 * la de Globex?").
 */
export interface AdminUserCandidate {
  profile: AdminUserProfile
  organizationNames: string[]
}

/** Resultado crudo de la búsqueda, antes de decidir si hay que desambiguar. */
export interface AdminUserSearchResult {
  /**
   * Criterio que encontró a los candidatos:
   *  - `identifier`: email o id → identifica sin ambigüedad.
   *  - `name`: nombre → varios homónimos son posibles y hay que preguntar.
   */
  matchedBy: 'identifier' | 'name'
  candidates: AdminUserCandidate[]
}

/** Resultado de la resolución de la consulta para un turno del chat. */
export interface AdminUserLookupResult {
  /** Dossiers completos (máximo MAX_DOSSIERS_PER_TURN). */
  dossiers: AdminUserDossier[]
  /** Candidatos cuando hay varios homónimos y hay que preguntar cuál es. */
  ambiguousCandidates: AdminUserCandidate[]
  /** true cuando hubo identificadores en el mensaje pero ningún usuario coincidió. */
  searchedWithoutMatches: boolean
}

/** Máximo de dossiers completos inyectados por turno (control de tamaño de prompt). */
export const MAX_DOSSIERS_PER_TURN = 2

/** Máximo de coincidencias listadas al pedir desambiguación. */
export const MAX_AMBIGUOUS_CANDIDATES = 5
