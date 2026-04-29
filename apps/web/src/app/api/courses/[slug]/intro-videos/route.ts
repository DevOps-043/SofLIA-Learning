import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/requireUser'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ slug: string }>
}

export interface IntroVideosResponse {
  videos: string[]
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

interface LpVideoRow {
  intro_video_url: string | null
  learning_path_id: string | null
}

interface LearningPathItemRow {
  learning_path_id: string
  course_id: string
  position: number
}

const EMPTY: IntroVideosResponse & { success: true } = {
  success: true,
  videos: [],
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

async function resolveLearningPathIntroVideo(params: {
  supabase: ReturnType<typeof getServiceClient>
  userId: string
  courseId: string
  organizationIds: string[]
}) {
  const { supabase, userId, courseId, organizationIds } = params

  const [
    lpVideosNewResult,
    lpVideosLegacyResult,
    orgAssignmentsResult,
    userAssignmentsResult,
  ] = await Promise.all([
    supabase
      .from('organization_lp_intro_videos')
      .select('learning_path_id, intro_video_url')
      .in('organization_id', organizationIds),
    supabase
      .from('organization_learning_path_assignments')
      .select('learning_path_id, intro_video_url')
      .in('organization_id', organizationIds)
      .eq('status', 'active')
      .not('intro_video_url', 'is', null),
    supabase
      .from('organization_learning_path_assignments')
      .select('learning_path_id')
      .in('organization_id', organizationIds)
      .eq('status', 'active'),
    supabase
      .from('user_learning_path_assignments')
      .select('learning_path_id')
      .eq('user_id', userId)
      .eq('status', 'assigned')
      .in('organization_id', organizationIds),
  ])

  if (lpVideosNewResult.error) {
    logger.error('GET intro-videos LP video table error:', lpVideosNewResult.error)
  }
  if (lpVideosLegacyResult.error) {
    logger.error('GET intro-videos LP legacy video error:', lpVideosLegacyResult.error)
  }

  const assignedLpIds = unique([
    ...((orgAssignmentsResult.data ?? []).map((row) => row.learning_path_id)),
    ...((userAssignmentsResult.data ?? []).map((row) => row.learning_path_id)),
  ])

  if (assignedLpIds.length === 0) {
    return { learningPathId: null, lpVideoUrl: null, lpIntroWatched: true }
  }

  const lpVideosMap = new Map<string, string>()
  const addLpVideo = (row: LpVideoRow) => {
    if (row.learning_path_id && row.intro_video_url && assignedLpIds.includes(row.learning_path_id)) {
      lpVideosMap.set(row.learning_path_id, row.intro_video_url)
    }
  }

  for (const row of (lpVideosNewResult.data ?? []) as LpVideoRow[]) addLpVideo(row)
  for (const row of (lpVideosLegacyResult.data ?? []) as LpVideoRow[]) {
    if (row.learning_path_id && !lpVideosMap.has(row.learning_path_id)) addLpVideo(row)
  }

  const lpIdsWithVideo = [...lpVideosMap.keys()]
  if (lpIdsWithVideo.length === 0) {
    return { learningPathId: null, lpVideoUrl: null, lpIntroWatched: true }
  }

  const { data: pathItems, error: itemsError } = await supabase
    .from('learning_path_items')
    .select('learning_path_id, course_id, position')
    .in('learning_path_id', lpIdsWithVideo)
    .order('position', { ascending: true })

  if (itemsError) {
    logger.error('GET intro-videos LP items error:', itemsError)
    return { learningPathId: null, lpVideoUrl: null, lpIntroWatched: true }
  }

  const firstItemByPath = new Map<string, LearningPathItemRow>()
  for (const item of (pathItems ?? []) as LearningPathItemRow[]) {
    if (!firstItemByPath.has(item.learning_path_id)) {
      firstItemByPath.set(item.learning_path_id, item)
    }
  }

  const firstMatchingLpId =
    lpIdsWithVideo.find((lpId) => firstItemByPath.get(lpId)?.course_id === courseId) ?? null

  if (!firstMatchingLpId) {
    return { learningPathId: null, lpVideoUrl: null, lpIntroWatched: true }
  }

  const { data: lpProgress } = await supabase
    .from('user_learning_path_progress')
    .select('lp_intro_watched_at')
    .eq('user_id', userId)
    .eq('learning_path_id', firstMatchingLpId)
    .maybeSingle()

  return {
    learningPathId: firstMatchingLpId,
    lpVideoUrl: lpVideosMap.get(firstMatchingLpId) ?? null,
    lpIntroWatched: Boolean(lpProgress?.lp_intro_watched_at),
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

    const [courseVideosResult, enrollmentsResult, lpIntro] = await Promise.all([
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
      resolveLearningPathIntroVideo({
        supabase,
        userId: auth.userId,
        courseId: course.id,
        organizationIds,
      }),
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

    const videos = courseVideoUrl && !courseIntroWatched ? [courseVideoUrl] : []
    const allVideos = unique([lpIntro.lpVideoUrl, courseVideoUrl])

    return NextResponse.json<IntroVideosResponse & { success: true }>({
      success: true,
      videos,
      allVideos,
      hasLpVideo: Boolean(lpIntro.lpVideoUrl),
      hasCourseVideo: Boolean(courseVideoUrl),
      lpIntroWatched: lpIntro.lpIntroWatched,
      courseIntroWatched,
      learningPathId: lpIntro.learningPathId,
    })
  } catch (error) {
    logger.error('GET intro-videos (course) error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
