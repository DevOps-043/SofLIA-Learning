import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'

interface LearningStats {
  avgTimePerLesson: number
  quizPassRate: number
  avgSessionsPerWeek: number
  topCoursesByTime: Array<{ course: string; minutes: number }>
  sessionsPlannedVsCompleted: Array<{ week: string; planned: number; completed: number }>
  timeByContentType: Array<{ type: string; minutes: number }>
  streakDistribution: Array<{ range: string; count: number }>
}

interface UserStatsLearningRpcClient {
  rpc(
    fn: 'get_admin_user_stats_learning',
    args?: Record<string, never>,
  ): PromiseLike<{
    data: LearningStats | null
    error: { message?: string } | null
  }>
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const supabase = createAdminClient()
    const { data: rpcLearning, error: rpcError } = await (
      supabase as unknown as UserStatsLearningRpcClient
    ).rpc('get_admin_user_stats_learning', {})

    if (!rpcError && rpcLearning) {
      return NextResponse.json(rpcLearning, { headers: cacheHeaders.privateShort })
    }

    if (rpcError) {
      logger.warn('Admin user learning stats RPC unavailable, using fallback', {
        error: rpcError.message,
      })
    }

    const now = new Date()
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString()

    const [
      lessonProgressRes,
      sessionsRes,
      trackingRes,
      dailyProgressRes,
      courseLessonsRes,
      coursesRes,
    ] = await Promise.all([
      supabase.from('user_lesson_progress').select('time_spent_minutes, quiz_completed, quiz_passed, lesson_id'),
      supabase.from('study_sessions').select('id, user_id, status, start_time, completed_at, actual_duration_minutes').gte('start_time', fourWeeksAgo),
      supabase.from('lesson_tracking').select('t_video_minutes, t_materials_minutes'),
      supabase.from('daily_progress').select('streak_count, user_id').gt('streak_count', 0),
      supabase.from('course_lessons').select('lesson_id, module_id, course_modules(course_id)'),
      supabase.from('courses').select('id, title'),
    ])

    const lessonProgress = lessonProgressRes.data || []
    const sessions = sessionsRes.data || []

    // Avg time per lesson
    const lessonsWithTime = lessonProgress.filter(lp => (lp.time_spent_minutes || 0) > 0)
    const avgTimePerLesson = lessonsWithTime.length > 0
      ? Math.round(lessonsWithTime.reduce((s, lp) => s + (lp.time_spent_minutes || 0), 0) / lessonsWithTime.length)
      : 0

    // Quiz pass rate
    const quizCompleted = lessonProgress.filter(lp => lp.quiz_completed)
    const quizPassed = quizCompleted.filter(lp => lp.quiz_passed)
    const quizPassRate = quizCompleted.length > 0 ? Math.round((quizPassed.length / quizCompleted.length) * 100) : 0

    // Avg sessions per user per week
    const distinctUsers = new Set(sessions.map(s => s.user_id)).size
    const avgSessionsPerWeek = distinctUsers > 0 ? Math.round((sessions.length / 4 / distinctUsers) * 10) / 10 : 0

    // Top courses by study time — build lesson→course map
    const coursesMap = new Map((coursesRes.data || []).map(c => [c.id, c.title]))
    const lessonToCourse = new Map<string, string>()
    for (const cl of (courseLessonsRes.data || [])) {
      const courseId = (cl.course_modules as { course_id?: string | null } | null)?.course_id
      if (courseId) lessonToCourse.set(cl.lesson_id, courseId)
    }
    const courseTimeMap = new Map<string, number>()
    for (const lp of lessonProgress) {
      const courseId = lessonToCourse.get(lp.lesson_id)
      if (courseId && lp.time_spent_minutes) {
        courseTimeMap.set(courseId, (courseTimeMap.get(courseId) || 0) + lp.time_spent_minutes)
      }
    }
    const topCoursesByTime = Array.from(courseTimeMap.entries())
      .map(([id, minutes]) => ({ course: coursesMap.get(id) || 'Curso desconocido', minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10)

    // Sessions planned vs completed by week
    const weekMap = new Map<string, { planned: number; completed: number }>()
    for (const s of sessions) {
      const weekStart = getWeekStart(new Date(s.start_time))
      const entry = weekMap.get(weekStart) || { planned: 0, completed: 0 }
      entry.planned++
      if (s.status === 'completed' || s.completed_at) entry.completed++
      weekMap.set(weekStart, entry)
    }
    const sessionsPlannedVsCompleted = Array.from(weekMap.entries())
      .map(([week, data]) => ({ week, ...data }))
      .sort((a, b) => a.week.localeCompare(b.week))

    // Time by content type
    const tracking = trackingRes.data || []
    const totalVideo = tracking.reduce((s, t) => s + (Number(t.t_video_minutes) || 0), 0)
    const totalMaterials = tracking.reduce((s, t) => s + (Number(t.t_materials_minutes) || 0), 0)
    const timeByContentType = [
      { type: 'Video', minutes: Math.round(totalVideo) },
      { type: 'Materiales', minutes: Math.round(totalMaterials) },
    ].filter(t => t.minutes > 0)

    // Streak distribution
    const streakBuckets = [
      { range: '1-3 días', min: 1, max: 3 },
      { range: '4-7 días', min: 4, max: 7 },
      { range: '8-14 días', min: 8, max: 14 },
      { range: '15-30 días', min: 15, max: 30 },
      { range: '30+ días', min: 31, max: Infinity },
    ]
    // Use max streak per user
    const userStreaks = new Map<string, number>()
    for (const dp of (dailyProgressRes.data || [])) {
      const current = userStreaks.get(dp.user_id) || 0
      if ((dp.streak_count || 0) > current) userStreaks.set(dp.user_id, dp.streak_count || 0)
    }
    const streakDistribution = streakBuckets.map(bucket => ({
      range: bucket.range,
      count: Array.from(userStreaks.values()).filter(s => s >= bucket.min && s <= bucket.max).length
    }))

    return NextResponse.json(
      {
        avgTimePerLesson,
        quizPassRate,
        avgSessionsPerWeek,
        topCoursesByTime,
        sessionsPlannedVsCompleted,
        timeByContentType,
        streakDistribution,
      },
      { headers: cacheHeaders.privateShort },
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    )
  }
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  return d.toISOString().split('T')[0]
}
