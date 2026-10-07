import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { cacheHeaders } from '@/lib/utils/cache-headers'
import { logger } from '@/lib/utils/logger'

function accessResponse(isPurchased: boolean) {
  return NextResponse.json({ isPurchased }, { headers: cacheHeaders.private })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params
    const rawOrgId = request.nextUrl.searchParams.get('orgId')
    const organizationId = rawOrgId && rawOrgId !== 'null' && rawOrgId !== 'undefined'
      ? rawOrgId
      : null

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return accessResponse(false)
    }

    // SessionService also accepts legacy sessions. Their cookies do not give
    // createClient() a Supabase JWT, so RLS could hide an existing enrollment.
    // Every query below is bounded by the authenticated user and selected org.
    const supabase = createAdminClient()

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()

    if (courseError) throw courseError
    if (!course) return accessResponse(false)

    let enrollmentQuery = supabase
      .from('user_course_enrollments')
      .select('organization_id')
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .in('enrollment_status', ['active', 'completed'])

    if (organizationId) enrollmentQuery = enrollmentQuery.eq('organization_id', organizationId)
    const { data: enrollments, error: enrollmentError } = await enrollmentQuery
    if (enrollmentError) throw enrollmentError

    // Verify membership even when an old enrollment survives removal from an org.
    const organizationIds = organizationId
      ? [organizationId]
      : [...new Set((enrollments ?? []).map(row => row.organization_id).filter((id): id is string => Boolean(id)))]
    if (organizationIds.length === 0) return accessResponse(false)

    const { data: memberships, error: membershipError } = await supabase
      .from('organization_users')
      .select('organization_id')
      .eq('user_id', currentUser.id)
      .eq('status', 'active')
      .in('organization_id', organizationIds)
    if (membershipError) throw membershipError

    const activeOrgIds = new Set((memberships ?? []).map(row => row.organization_id))
    if ((enrollments ?? []).some(row => row.organization_id && activeOrgIds.has(row.organization_id))) {
      return accessResponse(true)
    }

    if (!organizationId || !activeOrgIds.has(organizationId)) return accessResponse(false)

    const { data: assignment, error: assignmentError } = await supabase
      .from('organization_course_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .or('status.is.null,status.neq.cancelled')
      .limit(1)
      .maybeSingle()

    if (assignmentError) throw assignmentError
    return accessResponse(Boolean(assignment))
  } catch (error) {
    logger.error('Error checking course access', error)
    return NextResponse.json({ error: 'Error al verificar acceso al curso' }, { status: 500, headers: cacheHeaders.private })
  }
}
