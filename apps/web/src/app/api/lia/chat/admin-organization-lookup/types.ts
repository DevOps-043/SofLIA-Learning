import type { MentionIdentifiers } from '../admin-lookup-shared/mention-matching'

/**
 * Tipos del módulo de consulta de organizaciones para SofLIA.
 *
 * El dossier agrega, en una sola estructura, lo que un administrador puede
 * preguntar sobre una empresa: plan y licencias, composición de la plantilla,
 * adopción de cursos, actividad real de aprendizaje (incluida la fecha en que
 * cada persona empezó su primera lección), rutas de aprendizaje y uso de SofLIA.
 *
 * Alcance: el superadmin de plataforma puede pedir el dossier de CUALQUIER
 * organización; un owner/admin de organización solo el de la suya (el alcance lo
 * fija el grant, ver `../superadmin/authorization`).
 */

/** Identificadores de organización detectados en el mensaje del administrador. */
export type OrganizationLookupIdentifiers = MentionIdentifiers

/** Entrada del catálogo de organizaciones usada para detectar menciones. */
export interface OrganizationCatalogEntry {
  id: string
  name: string
  slug: string | null
}

export interface OrganizationProfile {
  id: string
  name: string
  slug: string | null
  description: string | null
  industry: string | null
  companySize: string | null
  companyType: string | null
  companyCountry: string | null
  companyMission: string | null
  contactEmail: string | null
  isActive: boolean
  subscriptionPlan: string | null
  subscriptionStatus: string | null
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  billingCycle: string | null
  maxUsers: number | null
  hierarchyEnabled: boolean
  brandingEnabled: boolean
  createdAt: string | null
}

/** Persona de la organización, con el mínimo necesario para el dossier. */
export interface OrganizationMember {
  userId: string
  name: string
  email: string | null
  role: string | null
  status: string | null
  jobTitle: string | null
  joinedAt: string | null
  lastActivityAt: string | null
  lastLoginAt: string | null
}

export interface OrganizationMemberSummary {
  totalMembers: number
  activeMembers: number
  invitedMembers: number
  suspendedMembers: number
  removedMembers: number
  owners: number
  admins: number
  regularMembers: number
  licenseLimit: number | null
  /** Porcentaje de licencias consumidas por miembros activos (0-100). */
  licenseUsagePercentage: number | null
  activeLast7Days: number
  activeLast30Days: number
  neverActive: number
  recentJoins: Array<{
    name: string
    role: string | null
    jobTitle: string | null
    joinedAt: string | null
  }>
  /** true si la lista de miembros se truncó por el límite de filas. */
  truncated: boolean
}

export interface OrganizationCourseAdoption {
  courseTitle: string
  enrolledUsers: number
  completedUsers: number
  averageProgressPercentage: number
  firstEnrollmentAt: string | null
  lastAccessedAt: string | null
}

/** Distribución temporal del arranque real del aprendizaje en la empresa. */
export interface OrganizationFirstLessonStarts {
  usersWithStart: number
  earliestAt: string | null
  latestAt: string | null
  medianAt: string | null
  /** Altas por mes (`YYYY-MM`), de más antiguo a más reciente. */
  monthlyDistribution: Array<{ month: string; users: number }>
  /** true si se alcanzó el tope de filas leídas (la distribución es parcial). */
  truncated: boolean
}

export interface OrganizationLearningActivity {
  lessonsStarted: number
  lessonsCompleted: number
  quizzesPassed: number
  firstLessonStarts: OrganizationFirstLessonStarts
}

export interface OrganizationLearningPathAdoption {
  learningPathTitle: string
  assignedAt: string | null
  usersWithProgress: number
  usersCompleted: number
  averageProgressPercentage: number
}

/** Rendimiento agregado de una persona dentro de la organización. */
export interface OrganizationMemberPerformance {
  name: string
  jobTitle: string | null
  coursesEnrolled: number
  coursesCompleted: number
  averageProgressPercentage: number
  lastAccessedAt: string | null
}

export interface OrganizationEngagement {
  liaConversations: number
  certificatesIssued: number
  pendingJoinRequests: number
}

export interface OrganizationDossier {
  profile: OrganizationProfile
  members: OrganizationMemberSummary
  courses: OrganizationCourseAdoption[]
  learning: OrganizationLearningActivity
  learningPaths: OrganizationLearningPathAdoption[]
  topPerformers: OrganizationMemberPerformance[]
  /** Miembros activos sin ninguna lección iniciada. */
  membersWithoutActivity: Array<{ name: string; jobTitle: string | null; joinedAt: string | null }>
  engagement: OrganizationEngagement
}

/** Fila del índice de organizaciones (solo superadmin, visión de plataforma). */
export interface OrganizationIndexEntry {
  name: string
  slug: string | null
  subscriptionPlan: string | null
  subscriptionStatus: string | null
  isActive: boolean
  activeMembers: number
  licenseLimit: number | null
  createdAt: string | null
}

/** Resultado de la resolución de la consulta para un turno del chat. */
export interface OrganizationLookupResult {
  /** Alcance del actor: define el texto de capacidad del prompt. */
  scope: 'platform' | 'organization'
  /** Dossier(s) resueltos para el turno. */
  dossiers: OrganizationDossier[]
  /** Varias organizaciones coinciden con lo mencionado: hay que preguntar cuál. */
  ambiguousCandidates: OrganizationCatalogEntry[]
  /** Se mencionó una organización y no existe ninguna coincidencia. */
  searchedWithoutMatches: boolean
  /**
   * Índice de plataforma (solo superadmin). Permite responder preguntas
   * comparativas sin haber nombrado una organización concreta.
   */
  platformIndex: OrganizationIndexEntry[] | null
  /** true si el índice se truncó por el tope de organizaciones listadas. */
  platformIndexTruncated: boolean
}

/** Máximo de dossiers completos inyectados por turno (tamaño de prompt). */
export const MAX_ORGANIZATION_DOSSIERS_PER_TURN = 2

/** Máximo de coincidencias listadas al pedir desambiguación. */
export const MAX_AMBIGUOUS_ORGANIZATIONS = 6

/** Tope de organizaciones del catálogo de detección de menciones. */
export const MAX_CATALOG_ORGANIZATIONS = 500

/** Tope de organizaciones listadas en el índice de plataforma. */
export const MAX_INDEXED_ORGANIZATIONS = 25

/**
 * Tope de membresías activas recorridas para contar usuarios por organización.
 * Si se alcanza, el índice avisa de que los recuentos son parciales en lugar de
 * dar cifras silenciosamente incompletas.
 */
export const MAX_INDEXED_MEMBERSHIP_ROWS = 10000

/** Tope de miembros leídos por dossier. */
export const MAX_MEMBER_ROWS = 500

/** Tope de inscripciones leídas por dossier. */
export const MAX_ENROLLMENT_ROWS = 2000

/**
 * Tope de filas de progreso de lección leídas para calcular el arranque del
 * aprendizaje. Se leen ordenadas por `started_at` ascendente, así que el primer
 * inicio de cada persona entra completo salvo en organizaciones enormes.
 */
export const MAX_LESSON_START_ROWS = 4000

/** Cursos y rutas mostrados en el dossier (los de mayor adopción primero). */
export const MAX_COURSES_IN_DOSSIER = 12
export const MAX_LEARNING_PATHS_IN_DOSSIER = 8

/** Personas listadas en los rankings del dossier. */
export const MAX_TOP_PERFORMERS = 8
export const MAX_MEMBERS_WITHOUT_ACTIVITY = 8
export const MAX_RECENT_JOINS = 8
