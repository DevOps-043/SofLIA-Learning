import { fromLoose } from '@/lib/supabase/looseQuery'
import { createAdminClient } from '@/lib/supabase/admin'

import {
  fetchActivitySubmissionEvents,
  fetchDialogueEvents,
  fetchEnrollmentEvents,
  fetchLearningPathAssignmentEvents,
  fetchLessonProgressEvents,
  fetchLoginSessions,
  fetchQuizAttemptEvents,
  loginSessionsToEvents,
  type DomainResult,
} from './user-forensics.queries'
import {
  fetchAccessIps,
  fetchAvailableDialogueCount,
  fetchCertificateEvents,
  fetchLiaConversationEvents,
  fetchNotes,
  fetchVideoTracking,
} from './user-forensics.queries.content'
import {
  computeForensicAggregates,
  computeForensicFlags,
} from './user-forensics.aggregates'
import {
  countForensicEventTypes,
  deriveFirstActivityAtUtc,
  deriveLastActivityAtUtc,
  sortForensicEventsDesc,
} from './user-forensics.timeline'
import type {
  ForensicEvent,
  ForensicIdentity,
  UserForensicSummary,
} from './user-forensics.types'

type AdminSupabaseClient = ReturnType<typeof createAdminClient>

interface UserIdentityRow {
  id: string
  email: string | null
  platform_role: string | null
  email_verified: boolean | null
  created_at: string | null
  last_login_at: string | null
  last_activity_at: string | null
  is_banned: boolean | null
  banned_at: string | null
  ban_reason: string | null
}

interface OrgMembershipRow {
  organizations: { name: string | null } | { name: string | null }[] | null
}

async function fetchOrganizationNames(
  supabase: AdminSupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await fromLoose<OrgMembershipRow>(supabase, 'organization_users')
    .select('organizations(name)')
    .eq('user_id', userId)
    .eq('status', 'active')

  const names = new Set<string>()
  for (const row of data ?? []) {
    const org = row.organizations
    const list = Array.isArray(org) ? org : org ? [org] : []
    for (const entry of list) {
      if (entry?.name) names.add(entry.name)
    }
  }
  return [...names]
}

async function fetchIdentity(
  supabase: AdminSupabaseClient,
  userId: string,
): Promise<ForensicIdentity | null> {
  const [{ data }, organizationNames] = await Promise.all([
    fromLoose<UserIdentityRow>(supabase, 'users')
      .select(
        'id, email, platform_role, email_verified, created_at, last_login_at, last_activity_at, is_banned, banned_at, ban_reason',
      )
      .eq('id', userId)
      .limit(1)
      .maybeSingle(),
    fetchOrganizationNames(supabase, userId),
  ])

  if (!data) return null

  return {
    id: data.id,
    email: data.email,
    role: data.platform_role,
    emailVerified: data.email_verified,
    organizationNames,
    createdAtUtc: data.created_at,
    lastLoginAtUtc: data.last_login_at,
    lastActivityAtUtc: data.last_activity_at,
    isBanned: data.is_banned,
    bannedAtUtc: data.banned_at,
    banReason: data.ban_reason,
  }
}

/**
 * Enriquece los títulos de eventos con los nombres de curso/lección/ruta, en una sola
 * pasada (sin N+1): junta los ids referenciados, trae los mapas y anexa el nombre.
 */
async function enrichTitles(
  supabase: AdminSupabaseClient,
  events: ForensicEvent[],
): Promise<void> {
  const courseIds = new Set<string>()
  const lessonIds = new Set<string>()
  const pathIds = new Set<string>()

  for (const event of events) {
    const courseId = event.refIds?.courseId
    const lessonId = event.refIds?.lessonId
    const pathId = event.refIds?.learningPathId
    if (courseId) courseIds.add(courseId)
    if (lessonId) lessonIds.add(lessonId)
    if (pathId) pathIds.add(pathId)
  }

  const [courses, lessons, paths] = await Promise.all([
    courseIds.size
      ? fromLoose<{ id: string; title: string | null }>(supabase, 'courses')
          .select('id, title')
          .in('id', [...courseIds])
      : Promise.resolve({ data: [] as Array<{ id: string; title: string | null }> }),
    lessonIds.size
      ? fromLoose<{ lesson_id: string; lesson_title: string | null }>(supabase, 'course_lessons')
          .select('lesson_id, lesson_title')
          .in('lesson_id', [...lessonIds])
      : Promise.resolve({ data: [] as Array<{ lesson_id: string; lesson_title: string | null }> }),
    pathIds.size
      ? fromLoose<{ id: string; title: string | null }>(supabase, 'learning_paths')
          .select('id, title')
          .in('id', [...pathIds])
      : Promise.resolve({ data: [] as Array<{ id: string; title: string | null }> }),
  ])

  const courseTitles = new Map((courses.data ?? []).map((row) => [row.id, row.title]))
  const lessonTitles = new Map((lessons.data ?? []).map((row) => [row.lesson_id, row.lesson_title]))
  const pathTitles = new Map((paths.data ?? []).map((row) => [row.id, row.title]))

  for (const event of events) {
    const parts: string[] = []
    const courseTitle = event.refIds?.courseId ? courseTitles.get(event.refIds.courseId) : null
    const lessonTitle = event.refIds?.lessonId ? lessonTitles.get(event.refIds.lessonId) : null
    const pathTitle = event.refIds?.learningPathId
      ? pathTitles.get(event.refIds.learningPathId)
      : null
    if (lessonTitle) parts.push(lessonTitle)
    if (courseTitle) parts.push(courseTitle)
    if (pathTitle) parts.push(pathTitle)
    if (parts.length > 0) {
      event.detail = event.detail ? `${parts.join(' · ')} — ${event.detail}` : parts.join(' · ')
    }
  }
}

/**
 * Reconstrucción forense completa de la actividad de un usuario. Corre todas las
 * sub-consultas en paralelo, mezcla la línea de tiempo, deriva la última actividad
 * REAL (MAX de eventos) y enriquece títulos. Solo lectura, service-role.
 */
export async function getUserForensicSummary(
  userId: string,
  supabaseClient?: AdminSupabaseClient,
): Promise<UserForensicSummary | null> {
  const supabase = supabaseClient ?? createAdminClient()

  const identity = await fetchIdentity(supabase, userId)
  if (!identity) return null

  const [
    loginResult,
    enrollments,
    lpAssignments,
    lessons,
    quizzes,
    dialogues,
    activities,
    video,
    notesResult,
    certificates,
    lia,
    accessIps,
    dialoguesAvailable,
  ] = await Promise.all([
    fetchLoginSessions(supabase, userId),
    fetchEnrollmentEvents(supabase, userId),
    fetchLearningPathAssignmentEvents(supabase, userId),
    fetchLessonProgressEvents(supabase, userId),
    fetchQuizAttemptEvents(supabase, userId),
    fetchDialogueEvents(supabase, userId),
    fetchActivitySubmissionEvents(supabase, userId),
    fetchVideoTracking(supabase, userId),
    fetchNotes(supabase, userId),
    fetchCertificateEvents(supabase, userId),
    fetchLiaConversationEvents(supabase, userId),
    fetchAccessIps(supabase, userId),
    fetchAvailableDialogueCount(supabase, userId),
  ])

  const domainResults: DomainResult[] = [
    enrollments,
    lpAssignments,
    lessons,
    quizzes,
    dialogues,
    activities,
  ]

  const allEvents: ForensicEvent[] = [
    ...loginSessionsToEvents(loginResult.sessions),
    ...domainResults.flatMap((result) => result.events),
    ...video.events,
    ...notesResult.events,
    ...certificates.events,
    ...lia.events,
  ]

  await enrichTitles(supabase, allEvents)

  const timeline = sortForensicEventsDesc(allEvents)

  const aggregates = computeForensicAggregates({
    events: allEvents,
    sessions: loginResult.sessions,
    accessIps,
    dialoguesAvailable,
    videoStats: video.stats,
    notes: notesResult.notes,
    certificate: { count: certificates.count, lastIssuedAtUtc: certificates.lastIssuedAtUtc },
    lia: { conversations: lia.conversations, abandoned: lia.abandoned, totalMessages: lia.totalMessages },
  })

  return {
    identity,
    sessions: loginResult.sessions,
    derivedLastActivityAtUtc: deriveLastActivityAtUtc(allEvents),
    firstActivityAtUtc: deriveFirstActivityAtUtc(allEvents),
    aggregates,
    flags: computeForensicFlags(aggregates),
    notes: notesResult.notes,
    timeline,
    eventTypeCounts: countForensicEventTypes(allEvents),
    totalEvents: allEvents.length,
    truncated:
      loginResult.truncated ||
      domainResults.some((result) => result.truncated) ||
      video.truncated ||
      notesResult.truncated ||
      certificates.truncated ||
      lia.truncated,
  }
}
