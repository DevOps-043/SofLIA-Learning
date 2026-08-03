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
  buildForensicContentIndex,
  collectContentIds,
  emptyContentIds,
  resolveContentContext,
  type ForensicContentIndex,
} from './user-forensics.content-index'
import { computeAttemptLocks } from './user-forensics.locks'
import { fetchAttemptLockSourceRows } from './user-forensics.queries.locks'
import {
  countForensicEventTypes,
  deriveFirstActivityAtUtc,
  deriveLastActivityAtUtc,
  sortForensicEventsDesc,
} from './user-forensics.timeline'
import type {
  ForensicAttemptLock,
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

function refsOf(event: ForensicEvent) {
  return {
    courseId: event.refIds?.courseId ?? null,
    lessonId: event.refIds?.lessonId ?? null,
    activityId: event.refIds?.activityId ?? null,
    learningPathId: event.refIds?.learningPathId ?? null,
  }
}

/**
 * Índice de contenido para TODO lo que se muestra en el panel (eventos + bloqueos):
 * una sola resolución jerárquica (actividad → lección → módulo → curso), sin N+1.
 */
async function buildContentIndexFor(
  supabase: AdminSupabaseClient,
  events: ForensicEvent[],
  locks: ForensicAttemptLock[],
): Promise<ForensicContentIndex> {
  const ids = collectContentIds(events.map(refsOf), emptyContentIds())
  collectContentIds(
    locks.map((lock) => ({
      lessonId: lock.target.lessonId,
      activityId: lock.target.activityId,
    })),
    ids,
  )
  return buildForensicContentIndex(supabase, ids)
}

/**
 * Anexa a cada evento su ubicación en el contenido (curso · módulo · lección ·
 * actividad). Se guarda en `context` —estructurado— en lugar de concatenarlo al
 * detalle: así la UI puede renderizar una miga de pan y el CSV columnas propias.
 */
function attachEventContext(index: ForensicContentIndex, events: ForensicEvent[]): void {
  for (const event of events) {
    event.context = resolveContentContext(index, refsOf(event))
  }
}

/**
 * Reconstrucción forense completa de la actividad de un usuario. Corre todas las
 * sub-consultas en paralelo, mezcla la línea de tiempo, deriva la última actividad
 * REAL (MAX de eventos), detecta los topes de intentos alcanzados y sitúa cada hecho
 * en su curso · módulo · lección. Solo lectura, service-role.
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
    lockSources,
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
    fetchAttemptLockSourceRows(supabase, userId),
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

  const locks = computeAttemptLocks(lockSources, userId)

  const contentIndex = await buildContentIndexFor(supabase, allEvents, locks)
  attachEventContext(contentIndex, allEvents)
  for (const lock of locks) {
    lock.context = resolveContentContext(contentIndex, {
      lessonId: lock.target.lessonId,
      activityId: lock.target.activityId,
    })
  }

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
    flags: computeForensicFlags(aggregates, locks),
    locks,
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
