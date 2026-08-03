import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'
import {
  CATALOG_CACHE_TTL_MS,
  createCatalogCache,
} from '../admin-lookup-shared/catalog-cache'
import {
  resolveOrganizationLookupScope,
  type AdminReadGrant,
  type AdminReadScope,
} from '../superadmin/authorization'
import {
  rankMemberPerformance,
  summarizeCourseAdoption,
  summarizeFirstLessonStarts,
  summarizeMembers,
  type EnrollmentRow,
  type LessonStartRow,
} from './organization-metrics'
import type {
  OrganizationCatalogEntry,
  OrganizationDossier,
  OrganizationIndexEntry,
  OrganizationLearningPathAdoption,
  OrganizationMember,
  OrganizationProfile,
} from './types'
import {
  MAX_CATALOG_ORGANIZATIONS,
  MAX_ENROLLMENT_ROWS,
  MAX_INDEXED_MEMBERSHIP_ROWS,
  MAX_INDEXED_ORGANIZATIONS,
  MAX_LEARNING_PATHS_IN_DOSSIER,
  MAX_LESSON_START_ROWS,
  MAX_MEMBER_ROWS,
} from './types'

/**
 * Lectura de datos de organizaciones para el contexto de SofLIA.
 *
 * SEGURIDAD: usa el cliente service-role, así que TODA función pública exige un
 * grant y deriva de él su alcance con `resolveOrganizationLookupScope`:
 *
 *  - grant de superadmin de plataforma → alcance global (cualquier empresa);
 *  - grant de owner/admin de organización → alcance fijado a SU tenant. Aunque
 *    se pida el id de otra empresa, la consulta se resuelve contra el del grant.
 *
 * Sin grant válido se lanza y no se consulta nada (fail-closed).
 */

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

const ORGANIZATION_PROFILE_COLUMNS =
  'id, name, slug, description, contact_email, industry, company_size, company_type, ' +
  'company_country, company_mission, is_active, subscription_plan, subscription_status, ' +
  'subscription_start_date, subscription_end_date, billing_cycle, max_users, ' +
  'hierarchy_enabled, branding_enabled, created_at'

interface OrganizationProfileRow {
  id: string
  name: string
  slug: string | null
  description: string | null
  contact_email: string | null
  industry: string | null
  company_size: string | null
  company_type: string | null
  company_country: string | null
  company_mission: string | null
  is_active: boolean | null
  subscription_plan: string | null
  subscription_status: string | null
  subscription_start_date: string | null
  subscription_end_date: string | null
  billing_cycle: string | null
  max_users: number | null
  hierarchy_enabled: boolean | null
  branding_enabled: boolean | null
  created_at: string | null
}

interface MemberRow {
  user_id: string
  role: string | null
  status: string | null
  job_title: string | null
  joined_at: string | null
  users: {
    display_name: string | null
    first_name: string | null
    last_name: string | null
    username: string | null
    email: string | null
    last_activity_at: string | null
    last_login_at: string | null
  } | null
}

function mapProfileRow(row: OrganizationProfileRow): OrganizationProfile {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    industry: row.industry,
    companySize: row.company_size,
    companyType: row.company_type,
    companyCountry: row.company_country,
    companyMission: row.company_mission,
    contactEmail: row.contact_email,
    isActive: row.is_active !== false,
    subscriptionPlan: row.subscription_plan,
    subscriptionStatus: row.subscription_status,
    subscriptionStartDate: row.subscription_start_date,
    subscriptionEndDate: row.subscription_end_date,
    billingCycle: row.billing_cycle,
    maxUsers: row.max_users,
    hierarchyEnabled: row.hierarchy_enabled === true,
    brandingEnabled: row.branding_enabled === true,
    createdAt: row.created_at,
  }
}

function buildMemberName(user: MemberRow['users']): string {
  return (
    user?.display_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    'sin nombre'
  )
}

/**
 * El catálogo se consulta en cada turno del chat para detectar menciones, pero
 * cambia pocas veces al día: se cachea por alcance durante un minuto.
 */
const organizationCatalogCache = createCatalogCache<OrganizationCatalogEntry[]>(
  CATALOG_CACHE_TTL_MS,
)

/**
 * Catálogo mínimo de organizaciones visibles para el actor. Es la base para
 * detectar de qué empresa habla el administrador sin adivinar nombres.
 */
export async function loadOrganizationCatalog(
  grant: AdminReadGrant,
): Promise<OrganizationCatalogEntry[]> {
  const scope = resolveOrganizationLookupScope(grant)

  // La clave lleva el alcance: dos tenants nunca comparten entrada de caché.
  return organizationCatalogCache.get(
    scope.organizationId ?? 'platform',
    async () => {
      const supabase = createAdminClient()
      let query = supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name', { ascending: true })
        .limit(MAX_CATALOG_ORGANIZATIONS)

      if (scope.organizationId) {
        query = query.eq('id', scope.organizationId)
      }

      const { data, error } = await query
      if (error) {
        logger.warn('Consulta de organización: fallo al cargar el catálogo', {
          error: error.message,
        })
        return []
      }

      return (data ?? []).map((row) => ({ id: row.id, name: row.name, slug: row.slug }))
    },
  )
}

/**
 * Índice comparativo de organizaciones. Solo tiene sentido —y solo se permite—
 * en alcance de plataforma: un administrador de organización no puede ver el
 * listado de otras empresas.
 */
export async function loadPlatformOrganizationIndex(
  grant: AdminReadGrant,
): Promise<{ entries: OrganizationIndexEntry[]; truncated: boolean }> {
  const scope = resolveOrganizationLookupScope(grant)
  if (scope.organizationId) {
    return { entries: [], truncated: false }
  }

  const supabase = createAdminClient()
  const [organizationsResult, membershipsResult] = await Promise.all([
    supabase
      .from('organizations')
      .select(
        'id, name, slug, subscription_plan, subscription_status, is_active, max_users, created_at',
      )
      .order('created_at', { ascending: false })
      .limit(MAX_CATALOG_ORGANIZATIONS),
    supabase
      .from('organization_users')
      .select('organization_id, status')
      .eq('status', 'active')
      .limit(MAX_INDEXED_MEMBERSHIP_ROWS),
  ])

  if (organizationsResult.error) {
    logger.warn('Consulta de organización: fallo al construir el índice de plataforma', {
      error: organizationsResult.error.message,
    })
    return { entries: [], truncated: false }
  }

  const activeMembersByOrganization = new Map<string, number>()
  for (const row of membershipsResult.data ?? []) {
    const organizationId = row.organization_id
    activeMembersByOrganization.set(
      organizationId,
      (activeMembersByOrganization.get(organizationId) ?? 0) + 1,
    )
  }

  const rows = organizationsResult.data ?? []
  const entries = rows
    .map((row) => ({
      name: row.name,
      slug: row.slug,
      subscriptionPlan: row.subscription_plan,
      subscriptionStatus: row.subscription_status,
      isActive: row.is_active !== false,
      activeMembers: activeMembersByOrganization.get(row.id) ?? 0,
      licenseLimit: row.max_users,
      createdAt: row.created_at,
    }))
    .sort((a, b) => b.activeMembers - a.activeMembers)

  // El recuento por empresa se calcula sobre las membresías leídas: si se
  // alcanzó el tope, las cifras son parciales y hay que decirlo.
  const membershipsTruncated =
    (membershipsResult.data?.length ?? 0) >= MAX_INDEXED_MEMBERSHIP_ROWS

  return {
    entries: entries.slice(0, MAX_INDEXED_ORGANIZATIONS),
    truncated: entries.length > MAX_INDEXED_ORGANIZATIONS || membershipsTruncated,
  }
}

async function loadMembers(
  supabase: AdminSupabaseClient,
  organizationId: string,
): Promise<{ members: OrganizationMember[]; truncated: boolean }> {
  const { data, error } = await supabase
    .from('organization_users')
    .select(
      'user_id, role, status, job_title, joined_at, ' +
        'users(display_name, first_name, last_name, username, email, last_activity_at, last_login_at)',
    )
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: false })
    .limit(MAX_MEMBER_ROWS)

  if (error) {
    logger.warn('Consulta de organización: fallo al cargar miembros', {
      error: error.message,
    })
    return { members: [], truncated: false }
  }

  const rows = (data ?? []) as unknown as MemberRow[]
  return {
    members: rows.map((row) => ({
      userId: row.user_id,
      name: buildMemberName(row.users),
      email: row.users?.email ?? null,
      role: row.role,
      status: row.status,
      jobTitle: row.job_title,
      joinedAt: row.joined_at,
      lastActivityAt: row.users?.last_activity_at ?? null,
      lastLoginAt: row.users?.last_login_at ?? null,
    })),
    truncated: rows.length >= MAX_MEMBER_ROWS,
  }
}

async function loadEnrollments(
  supabase: AdminSupabaseClient,
  organizationId: string,
): Promise<EnrollmentRow[]> {
  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select(
      'user_id, enrollment_status, overall_progress_percentage, enrolled_at, completed_at, last_accessed_at, courses(title)',
    )
    .eq('organization_id', organizationId)
    .order('enrolled_at', { ascending: false })
    .limit(MAX_ENROLLMENT_ROWS)

  if (error) {
    logger.warn('Consulta de organización: fallo al cargar inscripciones', {
      error: error.message,
    })
    return []
  }

  const rows = (data ?? []) as unknown as Array<{
    user_id: string
    enrollment_status: string | null
    overall_progress_percentage: number | null
    enrolled_at: string | null
    completed_at: string | null
    last_accessed_at: string | null
    courses: { title: string | null } | null
  }>

  return rows.map((row) => ({
    userId: row.user_id,
    courseTitle: row.courses?.title ?? null,
    status: row.enrollment_status,
    progressPercentage: Number(row.overall_progress_percentage) || 0,
    enrolledAt: row.enrolled_at,
    completedAt: row.completed_at,
    lastAccessedAt: row.last_accessed_at,
  }))
}

/**
 * Serie de inicios de lección, ordenada ascendentemente para que el PRIMER
 * inicio de cada persona entre siempre dentro del tope de filas. Solo se leen
 * dos columnas: es una consulta de serie temporal, no un volcado de progreso.
 */
async function loadLessonStarts(
  supabase: AdminSupabaseClient,
  organizationId: string,
): Promise<{ rows: LessonStartRow[]; truncated: boolean }> {
  const { data, error } = await supabase
    .from('user_lesson_progress')
    .select('user_id, started_at')
    .eq('organization_id', organizationId)
    .not('started_at', 'is', null)
    .order('started_at', { ascending: true })
    .limit(MAX_LESSON_START_ROWS)

  if (error) {
    logger.warn('Consulta de organización: fallo al cargar inicios de lección', {
      error: error.message,
    })
    return { rows: [], truncated: false }
  }

  const rows = (data ?? []) as unknown as Array<{
    user_id: string
    started_at: string | null
  }>

  return {
    rows: rows.map((row) => ({ userId: row.user_id, startedAt: row.started_at })),
    truncated: rows.length >= MAX_LESSON_START_ROWS,
  }
}

async function loadLearningPaths(
  supabase: AdminSupabaseClient,
  organizationId: string,
): Promise<OrganizationLearningPathAdoption[]> {
  const [assignmentsResult, progressResult] = await Promise.all([
    supabase
      .from('organization_learning_path_assignments')
      .select('learning_path_id, assigned_at, status, learning_paths(title)')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .limit(MAX_LEARNING_PATHS_IN_DOSSIER),
    supabase
      .from('user_learning_path_progress')
      .select('learning_path_id, status, progress_percentage')
      .eq('organization_id', organizationId)
      .limit(MAX_ENROLLMENT_ROWS),
  ])

  if (assignmentsResult.error) {
    logger.warn('Consulta de organización: fallo al cargar rutas de aprendizaje', {
      error: assignmentsResult.error.message,
    })
    return []
  }

  const progressRows = (progressResult.data ?? []) as unknown as Array<{
    learning_path_id: string
    status: string | null
    progress_percentage: number | null
  }>

  const assignments = (assignmentsResult.data ?? []) as unknown as Array<{
    learning_path_id: string
    assigned_at: string | null
    learning_paths: { title: string | null } | null
  }>

  return assignments.map((assignment) => {
    const rows = progressRows.filter(
      (row) => row.learning_path_id === assignment.learning_path_id,
    )
    const progressSum = rows.reduce(
      (sum, row) => sum + (Number(row.progress_percentage) || 0),
      0,
    )

    return {
      learningPathTitle: assignment.learning_paths?.title ?? 'Ruta sin título',
      assignedAt: assignment.assigned_at,
      usersWithProgress: rows.length,
      usersCompleted: rows.filter((row) => (row.status ?? '') === 'completed').length,
      averageProgressPercentage:
        rows.length > 0 ? Math.round((progressSum / rows.length) * 10) / 10 : 0,
    }
  })
}

/** Conteos que no requieren transferir filas (`head: true`). */
async function loadCounts(
  supabase: AdminSupabaseClient,
  organizationId: string,
): Promise<{
  lessonsStarted: number
  lessonsCompleted: number
  quizzesPassed: number
  liaConversations: number
  certificatesIssued: number
  pendingJoinRequests: number
}> {
  const countRows = (result: { count: number | null }) => result.count ?? 0

  const [
    lessonsStarted,
    lessonsCompleted,
    quizzesPassed,
    liaConversations,
    certificatesIssued,
    pendingJoinRequests,
  ] = await Promise.all([
    supabase
      .from('user_lesson_progress')
      .select('progress_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .not('started_at', 'is', null),
    supabase
      .from('user_lesson_progress')
      .select('progress_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('is_completed', true),
    supabase
      .from('user_lesson_progress')
      .select('progress_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('quiz_passed', true),
    supabase
      .from('lia_conversations')
      .select('conversation_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('user_course_certificates')
      .select('certificate_id', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    supabase
      .from('organization_join_requests')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending'),
  ])

  return {
    lessonsStarted: countRows(lessonsStarted),
    lessonsCompleted: countRows(lessonsCompleted),
    quizzesPassed: countRows(quizzesPassed),
    liaConversations: countRows(liaConversations),
    certificatesIssued: countRows(certificatesIssued),
    pendingJoinRequests: countRows(pendingJoinRequests),
  }
}

async function loadOrganizationProfile(
  supabase: AdminSupabaseClient,
  organizationId: string,
): Promise<OrganizationProfile | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select(ORGANIZATION_PROFILE_COLUMNS)
    .eq('id', organizationId)
    .maybeSingle()

  if (error || !data) {
    logger.warn('Consulta de organización: fallo al cargar el perfil', {
      error: error?.message,
    })
    return null
  }

  return mapProfileRow(data as unknown as OrganizationProfileRow)
}

/**
 * Construye el dossier completo de una organización.
 *
 * El `organizationId` solicitado se ignora cuando el grant es organizacional:
 * en ese caso siempre se consulta el tenant del grant. Es la barrera que impide
 * que una instrucción del modelo (o inyectada en datos) desvíe la lectura a otra
 * empresa.
 *
 * Cada consulta degrada de forma independiente: un fallo parcial recorta el
 * dossier pero no lo invalida.
 */
export async function buildOrganizationDossier(
  grant: AdminReadGrant,
  requestedOrganizationId: string,
): Promise<OrganizationDossier | null> {
  const scope: AdminReadScope = resolveOrganizationLookupScope(grant)
  const organizationId = scope.organizationId ?? requestedOrganizationId
  const supabase = createAdminClient()

  const profile = await loadOrganizationProfile(supabase, organizationId)
  if (!profile) return null

  const [memberResult, enrollments, lessonStarts, learningPaths, counts] =
    await Promise.all([
      loadMembers(supabase, organizationId),
      loadEnrollments(supabase, organizationId),
      loadLessonStarts(supabase, organizationId),
      loadLearningPaths(supabase, organizationId),
      loadCounts(supabase, organizationId),
    ])

  const usersWithLessonActivity = new Set(
    lessonStarts.rows.map((row) => row.userId),
  )

  const { topPerformers, membersWithoutActivity } = rankMemberPerformance({
    members: memberResult.members,
    enrollments,
    usersWithLessonActivity,
  })

  return {
    profile,
    members: summarizeMembers({
      members: memberResult.members,
      licenseLimit: profile.maxUsers,
      truncated: memberResult.truncated,
      now: Date.now(),
    }),
    courses: summarizeCourseAdoption(enrollments),
    learning: {
      lessonsStarted: counts.lessonsStarted,
      lessonsCompleted: counts.lessonsCompleted,
      quizzesPassed: counts.quizzesPassed,
      firstLessonStarts: summarizeFirstLessonStarts({
        rows: lessonStarts.rows,
        truncated: lessonStarts.truncated,
      }),
    },
    learningPaths,
    topPerformers,
    membersWithoutActivity,
    engagement: {
      liaConversations: counts.liaConversations,
      certificatesIssued: counts.certificatesIssued,
      pendingJoinRequests: counts.pendingJoinRequests,
    },
  }
}
