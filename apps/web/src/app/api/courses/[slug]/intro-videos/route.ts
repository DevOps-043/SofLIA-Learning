import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/requireUser'
import { resolveHlsUrlForSource } from '@/lib/media/server/hls-source-resolver.server'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export interface IntroVideosResponse {
  videos: string[]
  courseVideos: string[]
  allVideos: string[]
  hasLpVideo: boolean
  hasCourseVideo: boolean
  lpIntroWatched: boolean
  courseIntroWatched: boolean
  learningPathId: string | null
}

interface CourseVideoRow {
  intro_video_url: string | null
  organization_id: string
}

interface EnrollmentRow {
  course_intro_watched_at: string | null
  organization_id: string | null
}

const EMPTY: IntroVideosResponse & { success: true } = {
  success: true,
  videos: [],
  courseVideos: [],
  allVideos: [],
  hasLpVideo: false,
  hasCourseVideo: false,
  lpIntroWatched: true,
  courseIntroWatched: true,
  learningPathId: null,
}

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function isPlatformAdmin(role: string | null | undefined) {
  return role?.toLowerCase().trim() === 'administrador'
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function pickForOrganization<T extends { organization_id: string | null }>(
  rows: T[],
  organizationId: string | null,
) {
  if (!organizationId) return rows[0] ?? null
  return rows.find((row) => row.organization_id === organizationId) ?? rows[0] ?? null
}

async function resolveAllowedOrganizationIds(params: {
  supabase: ReturnType<typeof getServiceClient>
  userId: string
  userRole: string
  requestedOrgId: string | null
}) {
  const { supabase, userId, userRole, requestedOrgId } = params
  const platformAdmin = isPlatformAdmin(userRole)

  const { data: memberships, error } = await supabase
    .from('organization_users')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    logger.error('GET intro-videos memberships error:', error)
  }

  const membershipOrgIds = unique((memberships ?? []).map((row) => row.organization_id))

  if (requestedOrgId) {
    const canUseRequestedOrg = platformAdmin || membershipOrgIds.includes(requestedOrgId)
    return {
      denied: !canUseRequestedOrg,
      orgIds: canUseRequestedOrg ? [requestedOrgId] : [],
    }
  }

  return {
    denied: false,
    orgIds: membershipOrgIds,
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const requestedOrgId = new URL(request.url).searchParams.get('orgId')
    const auth = await requireUser()
    if (auth instanceof NextResponse) return auth

    const supabase = getServiceClient()

    const { data: course } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (!course) return NextResponse.json(EMPTY)

    const organizationResolution = await resolveAllowedOrganizationIds({
      supabase,
      userId: auth.userId,
      userRole: auth.userRole,
      requestedOrgId,
    })

    if (organizationResolution.denied) {
      return NextResponse.json({ success: false, error: 'Organizacion no permitida' }, { status: 403 })
    }

    const organizationIds = organizationResolution.orgIds
    if (organizationIds.length === 0) return NextResponse.json(EMPTY)

    const [courseVideosResult, enrollmentsResult] = await Promise.all([
      supabase
        .from('organization_course_intro_videos')
        .select('intro_video_url, organization_id')
        .eq('course_id', course.id)
        .in('organization_id', organizationIds),
      supabase
        .from('user_course_enrollments')
        .select('course_intro_watched_at, organization_id')
        .eq('user_id', auth.userId)
        .eq('course_id', course.id)
        .in('organization_id', organizationIds),
    ])

    if (courseVideosResult.error) {
      logger.error('GET intro-videos course video error:', courseVideosResult.error)
    }
    if (enrollmentsResult.error) {
      logger.error('GET intro-videos enrollment error:', enrollmentsResult.error)
    }

    const courseVideos = (courseVideosResult.data ?? []) as CourseVideoRow[]
    const enrollments = (enrollmentsResult.data ?? []) as EnrollmentRow[]
    const preferredOrgId =
      requestedOrgId ??
      courseVideos.find((video) =>
        enrollments.some((enrollment) => enrollment.organization_id === video.organization_id),
      )?.organization_id ??
      courseVideos[0]?.organization_id ??
      enrollments[0]?.organization_id ??
      organizationIds[0] ??
      null

    const courseVideo = pickForOrganization(courseVideos, preferredOrgId)
    const enrollment = pickForOrganization(enrollments, preferredOrgId)
    const courseVideoUrl = courseVideo?.intro_video_url ?? null
    const courseIntroWatched = Boolean(enrollment?.course_intro_watched_at)

    // Si el video introductorio ya fue transcodificado, servimos el
    // master.m3u8 para que el reproductor habilite el selector de
    // resolucion. Sin job completado se mantiene el MP4 original.
    const playbackUrl = await resolveHlsUrlForSource(supabase, courseVideoUrl)

    const courseVideosForPanel = playbackUrl ? [playbackUrl] : []
    const videos = playbackUrl && !courseIntroWatched ? [playbackUrl] : []

    return NextResponse.json<IntroVideosResponse & { success: true }>({
      success: true,
      videos,
      courseVideos: courseVideosForPanel,
      allVideos: courseVideosForPanel,
      hasLpVideo: false,
      hasCourseVideo: Boolean(courseVideoUrl),
      lpIntroWatched: true,
      courseIntroWatched,
      learningPathId: null,
    })
  } catch (error) {
    logger.error('GET intro-videos (course) error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
