import { logger } from '../../../../lib/utils/logger'
import { createClient } from '../../../../lib/supabase/server'
import {
  buildAnalyticsPrimaryUserIdMap,
  expandAnalyticsUserIds,
  normalizeAnalyticsUserId,
} from './analytics-identity.service'
import type {
  CourseAssignmentRecord,
  CourseCertificateRecord,
  DailyProgressRecord,
  LiaConversationRecord,
  LiaMessageRecord,
  OrganizationNodeRecord,
  OrganizationUserRecord,
} from './analytics-response.service'

type GlobalAnalyticsSupabaseClient = Awaited<ReturnType<typeof createClient>>
type Relation<T> = T | T[] | null

interface AnalyticsCourseRecord {
  id: string
  title: string | null
  slug?: string | null
}

export interface GlobalAnalyticsEnrollmentRecord {
  enrollment_id: string
  user_id: string
  course_id: string
  overall_progress_percentage: number | null
  enrollment_status: string | null
  completed_at: string | null
  started_at: string | null
  enrolled_at: string | null
  last_accessed_at: string | null
  courses: Relation<AnalyticsCourseRecord>
}

export interface GlobalAnalyticsLessonProgressRecord {
  progress_id: string
  user_id: string
  lesson_id: string
  enrollment_id: string | null
  time_spent_minutes: number | null
  is_completed: boolean | null
  completed_at: string | null
  started_at: string | null
  last_accessed_at: string | null
  quiz_completed: boolean | null
  quiz_passed: boolean | null
}

export interface GlobalAnalyticsStudyPlanRecord {
  id: string
  user_id: string
  status: string | null
  created_at: string | null
}

export interface GlobalAnalyticsStudyPlanProgressRecord {
  plan_id: string
  user_id: string
  plan_name: string | null
  total_sessions: number | null
  sessions_completed: number | null
  sessions_pending: number | null
}

export interface GlobalAnalyticsStudySessionRecord {
  id: string
  user_id: string
  start_time: string | null
  actual_duration_minutes: number | null
  status: string | null
  completed_at: string | null
  session_type: string | null
  is_ai_generated: boolean | null
}

export interface GlobalAnalyticsUserNoteRecord {
  id: string
  user_id: string
  is_auto_generated: boolean | null
}

interface GlobalAnalyticsWorkTeamRecord {
  team_id: string
  name: string
  description: string | null
  image_url: string | null
}

interface GlobalAnalyticsTeamMemberRecord {
  team_id: string
  user_id: string
}

export interface GlobalAnalyticsQueryData {
  orgUsers: OrganizationUserRecord[]
  assignments: CourseAssignmentRecord[]
  enrollments: GlobalAnalyticsEnrollmentRecord[]
  certificates: CourseCertificateRecord[]
  lessonProgress: GlobalAnalyticsLessonProgressRecord[]
  dailyProgress: DailyProgressRecord[]
  studyPlans: GlobalAnalyticsStudyPlanRecord[]
  studySessions: GlobalAnalyticsStudySessionRecord[]
  studyPlanProgress: GlobalAnalyticsStudyPlanProgressRecord[]
  nodes: OrganizationNodeRecord[]
  liaConversations: LiaConversationRecord[]
  liaMessages: LiaMessageRecord[]
  userNotes: GlobalAnalyticsUserNoteRecord[]
  thirtyDaysAgoStr: string
}

export async function fetchGlobalAnalyticsQueryData(
  supabase: GlobalAnalyticsSupabaseClient,
  organizationId: string,
): Promise<GlobalAnalyticsQueryData> {
  const orgUsersResult = await supabase
    .from('organization_users')
    .select(`
      user_id,
      role,
      status,
      joined_at,
      job_title,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        first_name,
        last_name,
        display_name,
        profile_picture_url,
        last_login_at,
        updated_at,
        created_at,
        cargo_rol
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .order('joined_at', { ascending: false })

  if (orgUsersResult.error) {
    throw orgUsersResult.error
  }

  const orgUsers = (orgUsersResult.data || []) as unknown as OrganizationUserRecord[]
  if (orgUsers.length === 0) {
    return getEmptyGlobalAnalyticsQueryData()
  }

  const userIds = orgUsers.map((user) => user.user_id)
  const orgEmails = orgUsers
    .map((user) => unwrapRelation(user.users)?.email || null)
    .filter(Boolean) as string[]

  const allUsersWithEmailsResult =
    orgEmails.length > 0
      ? await supabase.from('users').select('id, email').in('email', orgEmails)
      : { data: [], error: null }

  if (allUsersWithEmailsResult.error) {
    logger.error('Error fetching analytics identity records:', allUsersWithEmailsResult.error)
  }

  const allUsersWithEmails = (allUsersWithEmailsResult.data || []) as Array<{
    id: string
    email: string | null
  }>
  const primaryUserIdMap = buildAnalyticsPrimaryUserIdMap(
    orgUsers.map((user) => ({
      user_id: user.user_id,
      email: unwrapRelation(user.users)?.email || null,
    })),
    allUsersWithEmails,
  )
  const expandedUserIds = expandAnalyticsUserIds(userIds, allUsersWithEmails)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
  const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0]

  const [
    assignmentsResult,
    enrollmentsResult,
    certificatesResult,
    lessonProgressResult,
    dailyProgressResult,
    studyPlansResult,
    studySessionsResult,
    studyPlanProgressResult,
    liaConversationsResult,
    workTeamsResult,
    userNotesResult,
  ] = await Promise.all([
    supabase
      .from('organization_course_assignments')
      .select(
        'id, user_id, course_id, status, completion_percentage, assigned_at, due_date, completed_at',
      )
      .eq('organization_id', organizationId)
      .in('user_id', userIds),

    supabase
      .from('user_course_enrollments')
      .select(`
        enrollment_id,
        user_id,
        course_id,
        overall_progress_percentage,
        enrollment_status,
        completed_at,
        started_at,
        enrolled_at,
        last_accessed_at,
        courses (
          id,
          title,
          slug
        )
      `)
      .in('user_id', expandedUserIds),

    supabase
      .from('user_course_certificates')
      .select('certificate_id, user_id, course_id, issued_at')
      .in('user_id', expandedUserIds),

    supabase
      .from('user_lesson_progress')
      .select(
        'progress_id, user_id, lesson_id, enrollment_id, time_spent_minutes, is_completed, completed_at, started_at, last_accessed_at, quiz_completed, quiz_passed',
      )
      .in('user_id', expandedUserIds),

    supabase
      .from('daily_progress')
      .select(
        'user_id, progress_date, had_activity, streak_count, study_minutes, sessions_completed, sessions_missed',
      )
      .in('user_id', expandedUserIds)
      .gte('progress_date', sixMonthsAgoStr),

    supabase
      .from('study_plans')
      .select('id, user_id, status, created_at')
      .in('user_id', expandedUserIds),

    supabase
      .from('study_sessions')
      .select(
        'id, user_id, start_time, actual_duration_minutes, duration_minutes, status, completed_at, session_type, is_ai_generated',
      )
      .in('user_id', expandedUserIds)
      .gte('start_time', sixMonthsAgo.toISOString()),

    supabase
      .from('study_plan_progress')
      .select('plan_id, user_id, plan_name, total_sessions, sessions_completed, sessions_pending')
      .in('user_id', expandedUserIds),

    supabase
      .from('lia_conversations')
      .select('id, user_id, context_type, created_at')
      .in('user_id', expandedUserIds),

    supabase
      .from('work_teams')
      .select('team_id, name, description, image_url')
      .eq('organization_id', organizationId),

    supabase
      .from('user_lesson_notes')
      .select('note_id, user_id, is_auto_generated')
      .in('user_id', expandedUserIds),
  ])

  if (assignmentsResult.error) logger.error('Error fetching assignments:', assignmentsResult.error)
  if (enrollmentsResult.error) logger.error('Error fetching enrollments:', enrollmentsResult.error)
  if (certificatesResult.error) logger.error('Error fetching certificates:', certificatesResult.error)
  if (lessonProgressResult.error) {
    logger.error('Error fetching lesson progress:', lessonProgressResult.error)
  }
  if (dailyProgressResult.error) logger.error('Error fetching daily progress:', dailyProgressResult.error)
  if (studyPlansResult.error) logger.error('Error fetching study plans:', studyPlansResult.error)
  if (studySessionsResult.error) {
    logger.error('Error fetching study sessions:', studySessionsResult.error)
  }
  if (studyPlanProgressResult.error) {
    logger.error('Error fetching study plan progress:', studyPlanProgressResult.error)
  }
  if (liaConversationsResult.error) {
    logger.error('Error fetching LIA conversations:', liaConversationsResult.error)
  }
  if (workTeamsResult.error) logger.error('Error fetching work teams:', workTeamsResult.error)
  if (userNotesResult.error) logger.error('Error fetching user notes:', userNotesResult.error)

  const workTeams = (workTeamsResult.data || []) as unknown as GlobalAnalyticsWorkTeamRecord[]
  const teamIds = workTeams.map((team) => team.team_id)
  const conversationIds = ((liaConversationsResult.data || []) as Array<{ id: string }>).map(
    (conversation) => conversation.id,
  )

  const teamMembersResult =
    teamIds.length > 0
      ? await supabase
          .from('work_team_members')
          .select('team_id, user_id')
          .in('team_id', teamIds)
          .eq('status', 'active')
      : { data: [], error: null }

  const liaMessagesResult =
    conversationIds.length > 0
      ? await supabase
          .from('lia_messages')
          .select('id, conversation_id, role, user_id')
          .in('conversation_id', conversationIds)
      : { data: [], error: null }

  if (teamMembersResult.error) logger.error('Error fetching team members:', teamMembersResult.error)
  if (liaMessagesResult.error) logger.error('Error fetching LIA messages:', liaMessagesResult.error)

  const assignments = normalizeUserScopedItems(
    ((assignmentsResult.data || []) as unknown as CourseAssignmentRecord[]),
    primaryUserIdMap,
  )
  const enrollments = normalizeUserScopedItems(
    ((enrollmentsResult.data || []) as unknown as GlobalAnalyticsEnrollmentRecord[]),
    primaryUserIdMap,
  )
  const certificates = normalizeUserScopedItems(
    ((certificatesResult.data || []) as unknown as CourseCertificateRecord[]),
    primaryUserIdMap,
  )
  const lessonProgress = normalizeUserScopedItems(
    ((lessonProgressResult.data || []) as unknown as GlobalAnalyticsLessonProgressRecord[]),
    primaryUserIdMap,
  )
  const dailyProgress = normalizeUserScopedItems(
    ((dailyProgressResult.data || []) as unknown as DailyProgressRecord[]),
    primaryUserIdMap,
  )
  const studyPlans = normalizeUserScopedItems(
    ((studyPlansResult.data || []) as unknown as GlobalAnalyticsStudyPlanRecord[]),
    primaryUserIdMap,
  )
  const studyPlanProgress = normalizeUserScopedItems(
    ((studyPlanProgressResult.data || []) as unknown as GlobalAnalyticsStudyPlanProgressRecord[]),
    primaryUserIdMap,
  )
  const studySessions = normalizeUserScopedItems(
    ((studySessionsResult.data || []) as Array<
      GlobalAnalyticsStudySessionRecord & { duration_minutes?: number | null }
    >).map((session) => ({
      id: session.id,
      user_id: session.user_id,
      start_time: session.start_time,
      actual_duration_minutes:
        session.actual_duration_minutes ?? session.duration_minutes ?? null,
      status: session.status,
      completed_at: session.completed_at,
      session_type: session.session_type,
      is_ai_generated: session.is_ai_generated,
    })),
    primaryUserIdMap,
  )
  const liaConversations = normalizeUserScopedItems(
    ((liaConversationsResult.data || []) as unknown as LiaConversationRecord[]),
    primaryUserIdMap,
  )
  const liaMessages = normalizeUserScopedItems(
    ((liaMessagesResult.data || []) as unknown as LiaMessageRecord[]),
    primaryUserIdMap,
  )
  const userNotes = normalizeUserScopedItems(
    ((userNotesResult.data || []) as Array<{
      note_id: string
      user_id: string
      is_auto_generated: boolean | null
    }>).map((note) => ({
      id: note.note_id,
      user_id: note.user_id,
      is_auto_generated: note.is_auto_generated,
    })),
    primaryUserIdMap,
  )
  const nodes = normalizeWorkTeamsAsNodes(
    workTeams,
    ((teamMembersResult.data || []) as unknown as GlobalAnalyticsTeamMemberRecord[]),
    primaryUserIdMap,
  )

  return {
    orgUsers,
    assignments,
    enrollments,
    certificates,
    lessonProgress,
    dailyProgress,
    studyPlans,
    studySessions,
    studyPlanProgress,
    nodes,
    liaConversations,
    liaMessages,
    userNotes,
    thirtyDaysAgoStr,
  }
}

function normalizeUserScopedItems<T extends { user_id: string }>(
  items: T[],
  primaryUserIdMap: Map<string, string>,
): T[] {
  return items.flatMap((item) => {
    const normalizedUserId = normalizeAnalyticsUserId(item.user_id, primaryUserIdMap)
    return normalizedUserId ? [{ ...item, user_id: normalizedUserId }] : []
  })
}

function normalizeWorkTeamsAsNodes(
  workTeams: GlobalAnalyticsWorkTeamRecord[],
  teamMembers: GlobalAnalyticsTeamMemberRecord[],
  primaryUserIdMap: Map<string, string>,
): OrganizationNodeRecord[] {
  const membersByTeamId = teamMembers.reduce((map, member) => {
    const normalizedUserId = normalizeAnalyticsUserId(member.user_id, primaryUserIdMap)
    if (!normalizedUserId) return map

    const teamUsers = map.get(member.team_id)
    if (teamUsers) {
      teamUsers.add(normalizedUserId)
    } else {
      map.set(member.team_id, new Set([normalizedUserId]))
    }

    return map
  }, new Map<string, Set<string>>())

  return workTeams.map((team) => ({
    id: team.team_id,
    name: team.name,
    type: 'team',
    properties: {
      description: team.description,
      image_url: team.image_url,
    },
    organization_node_users: Array.from(membersByTeamId.get(team.team_id) || []).map(
      (userId) => ({ user_id: userId }),
    ),
  }))
}

function getEmptyGlobalAnalyticsQueryData(): GlobalAnalyticsQueryData {
  return {
    orgUsers: [],
    assignments: [],
    enrollments: [],
    certificates: [],
    lessonProgress: [],
    dailyProgress: [],
    studyPlans: [],
    studySessions: [],
    studyPlanProgress: [],
    nodes: [],
    liaConversations: [],
    liaMessages: [],
    userNotes: [],
    thirtyDaysAgoStr: new Date().toISOString().split('T')[0],
  }
}

function unwrapRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] || null
  }

  return relation || null
}
