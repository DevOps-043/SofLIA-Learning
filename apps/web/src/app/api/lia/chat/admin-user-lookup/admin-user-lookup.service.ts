import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  resolveUserLookupScope,
  type AdminReadGrant,
  type AdminReadScope,
} from '../superadmin/authorization'
import { stripLikeWildcards } from './identifier-extraction'
import {
  buildAccentTolerantPattern,
  matchesSearchedName,
} from './name-matching'
import type {
  AdminLookupIdentifiers,
  AdminUserDossier,
  AdminUserEnrollment,
  AdminUserLessonStats,
  AdminUserProfile,
  AdminUserSearchResult,
} from './types'

/**
 * Búsqueda de usuarios y construcción del dossier completo para el contexto
 * de SofLIA en modo administrativo.
 *
 * SEGURIDAD: este servicio usa el cliente service-role. Toda función pública
 * exige un grant y deriva de él su alcance con `resolveUserLookupScope`:
 *
 *  - grant de superadmin de plataforma (capacidad `user-lookup`) → cualquier
 *    usuario, con todas sus organizaciones y todo su historial;
 *  - grant de owner/admin de organización → SOLO miembros de ese tenant, y el
 *    dossier se recorta a la actividad ocurrida dentro de él (no revela que la
 *    persona pertenece a otras empresas ni su progreso en ellas).
 *
 * Sin grant válido se lanza y no se consulta nada (fail-closed).
 */

const USER_PROFILE_COLUMNS =
  'id, username, email, first_name, last_name, display_name, platform_role, is_banned, ban_reason, email_verified, created_at, last_login_at, last_activity_at'

const MAX_ENROLLMENTS = 20
const MAX_LESSON_ROWS = 500
const MAX_RECENT_COMPLETED_LESSONS = 8

interface UserProfileRow {
  id: string
  username: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
  display_name: string | null
  platform_role: string | null
  is_banned: boolean | null
  ban_reason: string | null
  email_verified: boolean | null
  created_at: string | null
  last_login_at: string | null
  last_activity_at: string | null
}

interface OrganizationMembershipRow {
  role: string | null
  status: string | null
  job_title: string | null
  joined_at: string | null
  organizations: { name: string | null; slug: string | null } | null
}

interface EnrollmentRow {
  course_id: string
  enrollment_status: string | null
  overall_progress_percentage: number | null
  enrolled_at: string | null
  started_at: string | null
  completed_at: string | null
  last_accessed_at: string | null
  courses: { title: string | null } | null
}

interface LessonProgressRow {
  lesson_status: string | null
  is_completed: boolean | null
  completed_at: string | null
  time_spent_minutes: number | null
  quiz_passed: boolean | null
  course_lessons: { lesson_title: string | null } | null
}

interface LearningPathProgressRow {
  status: string | null
  progress_percentage: number | null
  completed_items_count: number | null
  total_items_count: number | null
  learning_paths: { title: string | null } | null
}

interface CertificateRow {
  course_id: string
  issued_at: string | null
}

function mapProfileRow(row: UserProfileRow): AdminUserProfile {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    displayName: row.display_name,
    platformRole: row.platform_role,
    isBanned: row.is_banned === true,
    banReason: row.ban_reason,
    emailVerified: row.email_verified === true,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    lastActivityAt: row.last_activity_at,
  }
}

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

async function searchByUserIds(
  supabase: AdminSupabaseClient,
  userIds: string[],
): Promise<UserProfileRow[]> {
  if (userIds.length === 0) return []
  const { data, error } = await supabase
    .from('users')
    .select(USER_PROFILE_COLUMNS)
    .in('id', userIds)
  if (error) {
    logger.warn('Admin user lookup: fallo búsqueda por id', { error: error.message })
    return []
  }
  return (data || []) as unknown as UserProfileRow[]
}

async function searchByEmails(
  supabase: AdminSupabaseClient,
  emails: string[],
): Promise<UserProfileRow[]> {
  const results: UserProfileRow[] = []
  for (const email of emails) {
    const { data, error } = await supabase
      .from('users')
      .select(USER_PROFILE_COLUMNS)
      .ilike('email', email)
      .limit(2)
    if (error) {
      logger.warn('Admin user lookup: fallo búsqueda por email', { error: error.message })
      continue
    }
    results.push(...((data || []) as unknown as UserProfileRow[]))
  }
  return results
}

/** Cota de candidatos traídos por el patrón amplio antes de filtrar en JS. */
const MAX_NAME_SEARCH_CANDIDATES = 40

/**
 * Búsqueda por nombre insensible a acentos.
 *
 * El SQL usa un patrón tolerante (ver `name-matching.ts`) que trae candidatos
 * aunque el admin escriba "Maria" y en la base de datos figure "María"; el
 * filtrado exacto se hace después en JS sobre las formas normalizadas, de modo
 * que los falsos positivos del patrón amplio no llegan al resultado.
 *
 * Se busca por palabras sueltas contra `first_name` y `last_name` (además del
 * nombre completo contra `display_name`/`username`) porque el nombre puede
 * estar partido en columnas distintas.
 */
async function searchByName(
  supabase: AdminSupabaseClient,
  name: string,
): Promise<UserProfileRow[]> {
  const safeName = stripLikeWildcards(name)
  const pattern = buildAccentTolerantPattern(safeName)
  if (!pattern) return []

  const candidates: UserProfileRow[] = []

  const fetchCandidates = async (column: string, likePattern: string) => {
    const { data, error } = await supabase
      .from('users')
      .select(USER_PROFILE_COLUMNS)
      .ilike(column, likePattern)
      .limit(MAX_NAME_SEARCH_CANDIDATES)

    if (error) {
      logger.warn('Admin user lookup: fallo búsqueda por nombre', {
        column,
        error: error.message,
      })
      return
    }

    candidates.push(...((data || []) as unknown as UserProfileRow[]))
  }

  // Nombre completo contra las columnas que lo guardan entero.
  await Promise.all([
    fetchCandidates('display_name', pattern),
    fetchCandidates('username', pattern),
  ])

  // Palabras sueltas contra nombre y apellido (el nombre puede venir partido).
  const words = safeName.split(/\s+/).filter(Boolean)
  await Promise.all(
    words.flatMap((word) => {
      const wordPattern = buildAccentTolerantPattern(word)
      if (!wordPattern) return []
      return [
        fetchCandidates('first_name', wordPattern),
        fetchCandidates('last_name', wordPattern),
      ]
    }),
  )

  // Filtro exacto: descarta lo que el patrón amplio arrastró de más.
  const matched = new Map<string, UserProfileRow>()
  for (const candidate of candidates) {
    if (matched.has(candidate.id)) continue

    const candidateNames = [
      candidate.display_name,
      [candidate.first_name, candidate.last_name].filter(Boolean).join(' '),
      candidate.username,
    ]

    if (candidateNames.some((value) => matchesSearchedName(safeName, value))) {
      matched.set(candidate.id, candidate)
    }
  }

  return Array.from(matched.values())
}

/**
 * Organizaciones de cada candidato, para que la pregunta de desambiguación
 * muestre a qué empresa pertenece cada homónimo.
 */
async function fetchOrganizationNamesByUser(
  supabase: AdminSupabaseClient,
  userIds: string[],
): Promise<Map<string, string[]>> {
  const organizationsByUser = new Map<string, string[]>()
  if (userIds.length === 0) return organizationsByUser

  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id, organizations(name)')
    .in('user_id', userIds)

  if (error) {
    logger.warn('Admin user lookup: fallo al cargar organizaciones de candidatos', {
      error: error.message,
    })
    return organizationsByUser
  }

  const rows = (data || []) as unknown as Array<{
    user_id: string
    organizations: { name: string | null } | null
  }>

  for (const row of rows) {
    const organizationName = row.organizations?.name
    if (!organizationName) continue

    const current = organizationsByUser.get(row.user_id) || []
    if (!current.includes(organizationName)) {
      current.push(organizationName)
    }
    organizationsByUser.set(row.user_id, current)
  }

  return organizationsByUser
}

/**
 * Deja solo a los usuarios que pertenecen al tenant indicado.
 *
 * Se aceptan todos los estados de membresía (activo, invitado, suspendido,
 * retirado) porque el administrador de la organización gestiona a todos ellos;
 * lo que se descarta es a quien nunca ha pertenecido a su empresa.
 */
async function filterToOrganizationMembers(
  supabase: AdminSupabaseClient,
  userIds: string[],
  organizationId: string,
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set()

  const { data, error } = await supabase
    .from('organization_users')
    .select('user_id')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)

  if (error) {
    // Fail-closed: si no se puede comprobar la pertenencia, no se devuelve a nadie.
    logger.warn('Admin user lookup: fallo al verificar pertenencia a la organización', {
      error: error.message,
    })
    return new Set()
  }

  return new Set((data ?? []).map((row) => row.user_id))
}

/**
 * Busca usuarios por los identificadores extraídos del mensaje del admin.
 * Prioridad: id exacto > email > nombre. Devuelve candidatos deduplicados junto
 * con el criterio que los encontró (para decidir si hay que desambiguar).
 *
 * En alcance de organización, los candidatos que no son miembros del tenant se
 * descartan: para ese administrador, esas personas no existen.
 */
export async function searchUsersByIdentifiers(
  grant: AdminReadGrant,
  identifiers: AdminLookupIdentifiers,
): Promise<AdminUserSearchResult> {
  const scope = resolveUserLookupScope(grant)
  const supabase = createAdminClient()

  const byId = await searchByUserIds(supabase, identifiers.userIds)
  const byEmail = await searchByEmails(supabase, identifiers.emails)

  const highConfidence = [...byId, ...byEmail]

  // Si un identificador fuerte (id/email) ya resolvió, no se mezclan resultados
  // difusos por nombre: evita dossiers de usuarios no solicitados.
  const byName: UserProfileRow[] = []
  if (highConfidence.length === 0) {
    for (const name of identifiers.names) {
      byName.push(...(await searchByName(supabase, name)))
    }
  }

  const merged = new Map<string, UserProfileRow>()
  for (const row of [...highConfidence, ...byName]) {
    if (!merged.has(row.id)) merged.set(row.id, row)
  }

  let rows = Array.from(merged.values())

  if (scope.organizationId) {
    const memberIds = await filterToOrganizationMembers(
      supabase,
      rows.map((row) => row.id),
      scope.organizationId,
    )
    rows = rows.filter((row) => memberIds.has(row.id))
  }

  const profiles = rows.map(mapProfileRow)

  // La organización solo se necesita para desambiguar homónimos; se consulta
  // únicamente cuando hay varios candidatos, para no encarecer el caso normal.
  const organizationsByUser =
    profiles.length > 1
      ? await fetchOrganizationNamesByUser(
          supabase,
          profiles.map((profile) => profile.id),
        )
      : new Map<string, string[]>()

  return {
    // Una búsqueda por nombre con varias coincidencias es AMBIGUA: hay que
    // preguntarle al admin a cuál se refiere. Un id/email, en cambio, identifica
    // sin ambigüedad, así que ahí no se pregunta.
    matchedBy: highConfidence.length > 0 ? 'identifier' : 'name',
    candidates: profiles.map((profile) => ({
      profile,
      organizationNames: organizationsByUser.get(profile.id) ?? [],
    })),
  }
}

function buildLessonStats(rows: LessonProgressRow[]): AdminUserLessonStats {
  const completed = rows.filter(
    (row) => row.is_completed === true || Boolean(row.completed_at),
  )
  const recentCompletedLessons = completed
    .filter((row) => Boolean(row.completed_at))
    .sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''))
    .slice(0, MAX_RECENT_COMPLETED_LESSONS)
    .map((row) => ({
      lessonTitle: row.course_lessons?.lesson_title ?? null,
      completedAt: row.completed_at,
    }))

  return {
    totalLessonsTouched: rows.length,
    completedLessons: completed.length,
    totalStudyMinutes: Math.round(
      rows.reduce((sum, row) => sum + (Number(row.time_spent_minutes) || 0), 0),
    ),
    quizzesPassed: rows.filter((row) => row.quiz_passed === true).length,
    recentCompletedLessons,
  }
}

function buildEnrollments(
  enrollmentRows: EnrollmentRow[],
  certificateRows: CertificateRow[],
): AdminUserEnrollment[] {
  const certByCourse = new Map<string, string | null>()
  for (const cert of certificateRows) {
    certByCourse.set(cert.course_id, cert.issued_at)
  }

  return enrollmentRows.map((row) => ({
    courseTitle: row.courses?.title ?? null,
    status: row.enrollment_status,
    progressPercentage: Number(row.overall_progress_percentage) || 0,
    enrolledAt: row.enrolled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    lastAccessedAt: row.last_accessed_at,
    hasCertificate: certByCourse.has(row.course_id),
    certificateIssuedAt: certByCourse.get(row.course_id) ?? null,
  }))
}

/**
 * Construye el dossier completo de un usuario. Cada consulta degrada de forma
 * independiente (un fallo parcial no invalida el resto del dossier).
 *
 * En alcance organizacional, cada consulta se filtra además por
 * `organization_id`: sin ese recorte, el dossier de un empleado mostraría a su
 * administrador el progreso que esa persona tiene en OTRAS empresas.
 */
export async function buildAdminUserDossier(
  grant: AdminReadGrant,
  profile: AdminUserProfile,
): Promise<AdminUserDossier> {
  const scope: AdminReadScope = resolveUserLookupScope(grant)
  const supabase = createAdminClient()
  const userId = profile.id
  const tenantId = scope.organizationId

  const membershipsQuery = supabase
    .from('organization_users')
    .select('role, status, job_title, joined_at, organizations(name, slug)')
    .eq('user_id', userId)

  const enrollmentsQuery = supabase
    .from('user_course_enrollments')
    .select(
      'course_id, enrollment_status, overall_progress_percentage, enrolled_at, started_at, completed_at, last_accessed_at, courses(title)',
    )
    .eq('user_id', userId)

  const lessonsQuery = supabase
    .from('user_lesson_progress')
    .select(
      'lesson_status, is_completed, completed_at, time_spent_minutes, quiz_passed, course_lessons(lesson_title)',
    )
    .eq('user_id', userId)

  const learningPathsQuery = supabase
    .from('user_learning_path_progress')
    .select(
      'status, progress_percentage, completed_items_count, total_items_count, learning_paths(title)',
    )
    .eq('user_id', userId)

  const certificatesQuery = supabase
    .from('user_course_certificates')
    .select('course_id, issued_at')
    .eq('user_id', userId)

  const conversationCountQuery = supabase
    .from('lia_conversations')
    .select('conversation_id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const lastConversationQuery = supabase
    .from('lia_conversations')
    .select('started_at')
    .eq('user_id', userId)

  const [
    membershipsRes,
    enrollmentsRes,
    lessonsRes,
    learningPathsRes,
    certificatesRes,
    conversationCountRes,
    lastConversationRes,
  ] = await Promise.all([
    tenantId
      ? membershipsQuery.eq('organization_id', tenantId)
      : membershipsQuery,
    (tenantId ? enrollmentsQuery.eq('organization_id', tenantId) : enrollmentsQuery)
      .order('enrolled_at', { ascending: false })
      .limit(MAX_ENROLLMENTS),
    (tenantId ? lessonsQuery.eq('organization_id', tenantId) : lessonsQuery).limit(
      MAX_LESSON_ROWS,
    ),
    tenantId
      ? learningPathsQuery.eq('organization_id', tenantId)
      : learningPathsQuery,
    tenantId
      ? certificatesQuery.eq('organization_id', tenantId)
      : certificatesQuery,
    tenantId
      ? conversationCountQuery.eq('organization_id', tenantId)
      : conversationCountQuery,
    (tenantId
      ? lastConversationQuery.eq('organization_id', tenantId)
      : lastConversationQuery
    )
      .order('started_at', { ascending: false })
      .limit(1),
  ])

  const queryErrors = [
    membershipsRes.error,
    enrollmentsRes.error,
    lessonsRes.error,
    learningPathsRes.error,
    certificatesRes.error,
    conversationCountRes.error,
    lastConversationRes.error,
  ].filter(Boolean)
  if (queryErrors.length > 0) {
    // Degradación parcial: se registra sin PII y se continúa con lo disponible.
    logger.warn('Admin user lookup: fallos parciales al construir dossier', {
      failedQueries: queryErrors.length,
      firstError: queryErrors[0]?.message,
    })
  }

  const memberships = (membershipsRes.data ||
    []) as unknown as OrganizationMembershipRow[]
  const enrollmentRows = (enrollmentsRes.data || []) as unknown as EnrollmentRow[]
  const lessonRows = (lessonsRes.data || []) as unknown as LessonProgressRow[]
  const learningPathRows = (learningPathsRes.data ||
    []) as unknown as LearningPathProgressRow[]
  const certificateRows = (certificatesRes.data ||
    []) as unknown as CertificateRow[]
  const lastConversationRow = (lastConversationRes.data?.[0] ?? null) as {
    started_at: string | null
  } | null

  return {
    profile,
    organizations: memberships.map((row) => ({
      organizationName: row.organizations?.name ?? null,
      organizationSlug: row.organizations?.slug ?? null,
      role: row.role,
      status: row.status,
      jobTitle: row.job_title,
      joinedAt: row.joined_at,
    })),
    enrollments: buildEnrollments(enrollmentRows, certificateRows),
    lessonStats: buildLessonStats(lessonRows),
    learningPaths: learningPathRows.map((row) => ({
      learningPathTitle: row.learning_paths?.title ?? null,
      status: row.status,
      progressPercentage: Number(row.progress_percentage) || 0,
      completedItems: Number(row.completed_items_count) || 0,
      totalItems: Number(row.total_items_count) || 0,
    })),
    liaUsage: {
      conversationCount: conversationCountRes.count ?? 0,
      lastConversationAt: lastConversationRow?.started_at ?? null,
    },
  }
}
