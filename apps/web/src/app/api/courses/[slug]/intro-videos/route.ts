import { NextRequest, NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/requireUser'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export interface IntroVideosResponse {
  videos: string[]
  hasLpVideo: boolean
  hasCourseVideo: boolean
  lpIntroWatched: boolean
  courseIntroWatched: boolean
  learningPathId: string | null
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const auth = await requireUser()
    if (auth instanceof NextResponse) return auth

    const supabase = await createClient()

    // Resolver course_id a partir del slug
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ success: false, error: 'Curso no encontrado' }, { status: 404 })
    }

    const courseId = course.id

    // Obtener la organización del usuario
    const { data: membership, error: membershipError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', auth.userId)
      .eq('status', 'active')
      .limit(1)
      .single()

    if (membershipError || !membership) {
      // Usuario sin org (B2C) — no hay videos introductorios de empresa
      return NextResponse.json<IntroVideosResponse & { success: true }>({
        success: true,
        videos: [],
        hasLpVideo: false,
        hasCourseVideo: false,
        lpIntroWatched: true,
        courseIntroWatched: true,
        learningPathId: null,
      })
    }

    const organizationId = membership.organization_id

    // Consultas paralelas para mayor eficiencia
    const [courseVideoResult, enrollmentResult, firstLpResult] = await Promise.all([
      // Video introductorio del curso para esta org
      supabase
        .from('organization_course_intro_videos')
        .select('intro_video_url')
        .eq('organization_id', organizationId)
        .eq('course_id', courseId)
        .maybeSingle(),

      // Estado del enrollment para saber si ya vio el intro del curso
      supabase
        .from('user_course_enrollments')
        .select('course_intro_watched_at')
        .eq('user_id', auth.userId)
        .eq('course_id', courseId)
        .eq('organization_id', organizationId)
        .maybeSingle(),

      // LP asignado más antiguo del usuario que contenga este curso en posición 1
      supabase
        .from('user_learning_path_assignments')
        .select(`
          learning_path_id,
          assigned_at,
          learning_path:learning_paths!inner(
            id,
            items:learning_path_items!inner(position, course_id)
          )
        `)
        .eq('user_id', auth.userId)
        .eq('organization_id', organizationId)
        .eq('status', 'assigned')
        .order('assigned_at', { ascending: true })
        .limit(10),
    ])

    const courseVideoUrl = courseVideoResult.data?.intro_video_url ?? null
    const courseIntroWatched = Boolean(enrollmentResult.data?.course_intro_watched_at)

    // Determinar si este curso es el primero del primer LP del usuario
    let lpVideoUrl: string | null = null
    let lpIntroWatched = true
    let firstMatchingLpId: string | null = null

    if (!firstLpResult.error && firstLpResult.data?.length) {
      for (const assignment of firstLpResult.data) {
        const lp = assignment.learning_path as {
          id: string
          items: { position: number; course_id: string }[]
        } | null

        if (!lp?.items) continue

        const firstItem = lp.items.reduce(
          (min: { position: number; course_id: string } | null, item) =>
            !min || item.position < min.position ? item : min,
          null,
        )

        if (firstItem?.course_id === courseId) {
          firstMatchingLpId = lp.id
          break
        }
      }
    }

    if (firstMatchingLpId) {
      const [orgLpAssignment, lpProgressResult] = await Promise.all([
        supabase
          .from('organization_learning_path_assignments')
          .select('intro_video_url')
          .eq('organization_id', organizationId)
          .eq('learning_path_id', firstMatchingLpId)
          .eq('status', 'active')
          .maybeSingle(),

        supabase
          .from('user_learning_path_progress')
          .select('lp_intro_watched_at')
          .eq('user_id', auth.userId)
          .eq('learning_path_id', firstMatchingLpId)
          .maybeSingle(),
      ])

      lpVideoUrl = orgLpAssignment.data?.intro_video_url ?? null
      lpIntroWatched = Boolean(lpProgressResult.data?.lp_intro_watched_at)
    }

    // Construir lista de videos a mostrar (omitir ya vistos)
    const videos: string[] = []
    if (lpVideoUrl && !lpIntroWatched) videos.push(lpVideoUrl)
    if (courseVideoUrl && !courseIntroWatched) videos.push(courseVideoUrl)

    return NextResponse.json<IntroVideosResponse & { success: true }>({
      success: true,
      videos,
      hasLpVideo: Boolean(lpVideoUrl),
      hasCourseVideo: Boolean(courseVideoUrl),
      lpIntroWatched,
      courseIntroWatched,
      learningPathId: firstMatchingLpId,
    })
  } catch (error) {
    logger.error('GET intro-videos error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
