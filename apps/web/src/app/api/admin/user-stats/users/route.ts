import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { calculateAgeFromDateOfBirth } from '@/lib/schemas/user-demographics.schema'
import { logger } from '@/lib/utils/logger'
import {
  buildStudyMinutesByUser,
  type CourseLessonTimeRow,
  type LessonProgressTimeRow,
  type LessonTrackingTimeRow,
} from '../study-time'

const MAX_SEARCH_LENGTH = 80

function normalizeAdminUserSearch(value: string | null): string {
  return (value || '')
    .trim()
    .replace(/[,%*_()[\]{}"'\\;]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_SEARCH_LENGTH)
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const search = normalizeAdminUserSearch(searchParams.get('search'))
    const orgFilter = searchParams.get('org') || ''
    const statusFilter = searchParams.get('status') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const offset = (page - 1) * limit

    // Build user query
    let userQuery = supabase.from('users').select('id, username, email, display_name, first_name, last_name, profile_picture_url, last_login_at, country_code, date_of_birth, gender', { count: 'exact' })

    if (search) {
      userQuery = userQuery.or(`username.ilike.%${search}%,email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    if (statusFilter === 'active') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      userQuery = userQuery.gte('last_login_at', thirtyDaysAgo)
    } else if (statusFilter === 'inactive') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      userQuery = userQuery.or(`last_login_at.is.null,last_login_at.lt.${thirtyDaysAgo}`)
    }

    userQuery = userQuery.order('last_login_at', { ascending: false, nullsFirst: false }).range(offset, offset + limit - 1)

    const { data: users, count: totalCount, error: usersError } = await userQuery

    if (usersError) {
      logger.error('Failed to fetch admin user stats users', { error: usersError.message })
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ users: [], total: 0, page, limit })
    }

    const userIds = users.map(u => u.id)

    // Fetch related data for these users in parallel
    const [
      orgUsersRes,
      enrollmentsRes,
      certificatesRes,
      studyMinutesRes,
      lessonProgressRes,
      lessonTrackingRes,
      courseLessonsRes,
    ] = await Promise.all([
      supabase.from('organization_users').select('user_id, role, organizations(name)').in('user_id', userIds).eq('status', 'active'),
      supabase.from('user_course_enrollments').select('user_id, overall_progress_percentage').in('user_id', userIds),
      supabase.from('user_course_certificates').select('user_id').in('user_id', userIds),
      supabase.from('daily_progress').select('user_id, study_minutes').in('user_id', userIds),
      supabase.from('user_lesson_progress').select('user_id, lesson_id, time_spent_minutes, is_completed, lesson_status, completed_at').in('user_id', userIds),
      supabase.from('lesson_tracking').select('user_id, lesson_id, status, started_at, completed_at, t_lesson_minutes, t_video_minutes, t_materials_minutes').in('user_id', userIds),
      supabase.from('course_lessons').select('lesson_id, duration_seconds, total_duration_minutes'),
    ])

    // Build lookup maps
    const orgUserMap = new Map<string, { org: string; role: string }>()
    for (const ou of (orgUsersRes.data || [])) {
      const orgName = (ou.organizations as { name?: string | null } | null)?.name || null
      if (orgName) orgUserMap.set(ou.user_id, { org: orgName, role: ou.role || 'member' })
    }

    const enrollmentMap = new Map<string, { count: number; avgProgress: number }>()
    const enrollmentsByUser = new Map<string, number[]>()
    for (const e of (enrollmentsRes.data || [])) {
      if (!enrollmentsByUser.has(e.user_id)) enrollmentsByUser.set(e.user_id, [])
      enrollmentsByUser.get(e.user_id)!.push(Number(e.overall_progress_percentage) || 0)
    }
    for (const [userId, progresses] of enrollmentsByUser) {
      enrollmentMap.set(userId, {
        count: progresses.length,
        avgProgress: Math.round(progresses.reduce((s, p) => s + p, 0) / progresses.length),
      })
    }

    const certCountMap = new Map<string, number>()
    for (const c of (certificatesRes.data || [])) {
      certCountMap.set(c.user_id, (certCountMap.get(c.user_id) || 0) + 1)
    }

    const studyMinutesMap = new Map<string, number>()
    for (const dp of (studyMinutesRes.data || [])) {
      studyMinutesMap.set(dp.user_id, (studyMinutesMap.get(dp.user_id) || 0) + (dp.study_minutes || 0))
    }
    const computedStudyMinutesMap = buildStudyMinutesByUser({
      courseLessons: (courseLessonsRes.data || []) as CourseLessonTimeRow[],
      lessonProgress: (lessonProgressRes.data || []) as LessonProgressTimeRow[],
      lessonTracking: (lessonTrackingRes.data || []) as LessonTrackingTimeRow[],
    })

    // Filter by org if requested
    let filteredUsers = users
    if (orgFilter) {
      const matchingUserIds = new Set(
        Array.from(orgUserMap.entries())
          .filter(([_, v]) => v.org.toLowerCase().includes(orgFilter.toLowerCase()))
          .map(([uid]) => uid)
      )
      filteredUsers = users.filter(u => matchingUserIds.has(u.id))
    }

    const result = filteredUsers.map(u => {
      const orgInfo = orgUserMap.get(u.id)
      const enrollInfo = enrollmentMap.get(u.id)
      const persistedStudyMinutes = studyMinutesMap.get(u.id) || 0
      const resolvedStudyMinutes = persistedStudyMinutes > 0
        ? persistedStudyMinutes
        : computedStudyMinutesMap.get(u.id) || 0
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        displayName: u.display_name || [u.first_name, u.last_name].filter(Boolean).join(' ') || null,
        profilePictureUrl: u.profile_picture_url,
        dateOfBirth: u.date_of_birth,
        gender: u.gender,
        age: calculateAgeFromDateOfBirth(u.date_of_birth),
        organization: orgInfo?.org || null,
        orgRole: orgInfo?.role || null,
        coursesEnrolled: enrollInfo?.count || 0,
        avgProgress: enrollInfo?.avgProgress || 0,
        studyHours: Math.round((resolvedStudyMinutes / 60) * 10) / 10,
        lastLogin: u.last_login_at,
        certificates: certCountMap.get(u.id) || 0,
      }
    })

    return NextResponse.json({
      users: result,
      total: totalCount ?? 0,
      page,
      limit,
    })
  } catch (error) {
    logger.error('Unexpected error in admin user stats users route', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
