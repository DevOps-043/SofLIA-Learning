import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { cacheGet, cacheSet } from '@/lib/cache/ttlCache'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'
import {
  buildStudyMinutesByUserLesson,
  parseUserLessonKey,
  type CourseLessonTimeRow,
  type LessonProgressTimeRow,
  type LessonTrackingTimeRow,
} from '../study-time'

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

type LearningLessonProgressRow = LessonProgressTimeRow & {
  quiz_completed?: boolean | null
  quiz_passed?: boolean | null
}

type CourseLessonWithCourseRow = CourseLessonTimeRow & {
  module_id?: string | null
  course_modules?: { course_id?: string | null } | null
}

// Métricas agregadas de aprendizaje del dashboard: mismo resultado para todos
// los admins, sin frescura al segundo. Se cachea el resultado en servidor para
// no recalcular la consulta analítica pesada en cada carga. Auth por request.
const LEARNING_CACHE_KEY = 'admin-user-stats:learning'
const LEARNING_CACHE_TTL_MS = 60_000

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const cached = cacheGet<Record<string, unknown>>(LEARNING_CACHE_KEY)
    if (cached) {
      return NextResponse.json(cached, { headers: cacheHeaders.privateShort })
    }

    // Cachea el payload y responde (usado en el camino RPC y en el fallback).
    const respond = (payload: Record<string, unknown>) => {
      cacheSet(LEARNING_CACHE_KEY, payload, LEARNING_CACHE_TTL_MS)
      return NextResponse.json(payload, { headers: cacheHeaders.privateShort })
    }

    const supabase = createAdminClient()
    const { data: rpcLearning, error: rpcError } = await (
      supabase as unknown as UserStatsLearningRpcClient
    ).rpc('get_admin_user_stats_learning', {})

    if (!rpcError && rpcLearning) {
      return respond(rpcLearning as unknown as Record<string, unknown>)
    }

    if (rpcError) {
      logger.warn('Admin user learning stats RPC unavailable, using fallback', {
        error: rpcError.message,
      })
    }

    const now = new Date()

    const [
      lessonProgressRes,
      trackingRes,
      dailyProgressRes,
      courseLessonsRes,
      coursesRes,
    ] = await Promise.all([
      supabase.from('user_lesson_progress').select('user_id, lesson_id, time_spent_minutes, is_completed, lesson_status, completed_at, quiz_completed, quiz_passed'),
      supabase.from('lesson_tracking').select('user_id, lesson_id, status, started_at, completed_at, t_lesson_minutes, t_video_minutes, t_materials_minutes'),
      supabase.from('daily_progress').select('streak_count, user_id').gt('streak_count', 0),
      supabase.from('course_lessons').select('lesson_id, module_id, duration_seconds, total_duration_minutes, course_modules(course_id)'),
      supabase.from('courses').select('id, title'),
    ])

    const lessonProgress = (lessonProgressRes.data || []) as LearningLessonProgressRow[]
    const courseLessons = (courseLessonsRes.data || []) as CourseLessonWithCourseRow[]
    const studyMinutesByUserLesson = buildStudyMinutesByUserLesson({
      courseLessons,
      lessonProgress,
      lessonTracking: (trackingRes.data || []) as LessonTrackingTimeRow[],
    })

    // Avg time per lesson
    const lessonsWithTime = Array.from(studyMinutesByUserLesson.values()).filter(minutes => minutes > 0)
    const avgTimePerLesson = lessonsWithTime.length > 0
      ? Math.round(lessonsWithTime.reduce((sum, minutes) => sum + minutes, 0) / lessonsWithTime.length)
      : 0

    // Quiz pass rate
    const quizCompleted = lessonProgress.filter(lp => lp.quiz_completed)
    const quizPassed = quizCompleted.filter(lp => lp.quiz_passed)
    const quizPassRate = quizCompleted.length > 0 ? Math.round((quizPassed.length / quizCompleted.length) * 100) : 0

    // Métrica de sesiones de estudio retirada junto con el StudyPlanner.
    const avgSessionsPerWeek = 0

    // Top courses by study time — build lesson→course map
    const coursesMap = new Map((coursesRes.data || []).map(c => [c.id, c.title]))
    const lessonToCourse = new Map<string, string>()
    for (const cl of courseLessons) {
      const courseId = (cl.course_modules as { course_id?: string | null } | null)?.course_id
      if (courseId) lessonToCourse.set(cl.lesson_id, courseId)
    }
    const courseTimeMap = new Map<string, number>()
    studyMinutesByUserLesson.forEach((minutes, key) => {
      const { lessonId } = parseUserLessonKey(key)
      const courseId = lessonToCourse.get(lessonId)
      if (courseId && minutes > 0) {
        courseTimeMap.set(courseId, (courseTimeMap.get(courseId) || 0) + minutes)
      }
    })
    const topCoursesByTime = Array.from(courseTimeMap.entries())
      .map(([id, minutes]) => ({ course: coursesMap.get(id) || 'Curso desconocido', minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10)

    // Serie de sesiones planificadas vs completadas retirada con el StudyPlanner.
    const sessionsPlannedVsCompleted: Array<{ week: string; planned: number; completed: number }> = []

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

    return respond({
      avgTimePerLesson,
      quizPassRate,
      avgSessionsPerWeek,
      topCoursesByTime,
      sessionsPlannedVsCompleted,
      timeByContentType,
      streakDistribution,
    })
  } catch (error) {
    logger.error('Unexpected error in admin user stats learning route', { error })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
