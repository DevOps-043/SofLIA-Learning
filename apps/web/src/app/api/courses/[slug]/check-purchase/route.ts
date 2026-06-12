import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const supabase = await createClient()
    const { slug } = await params
    const rawOrgId = request.nextUrl.searchParams.get('orgId')
    const organizationId = rawOrgId && rawOrgId !== 'null' && rawOrgId !== 'undefined'
      ? rawOrgId
      : null

    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ isPurchased: false })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('slug', slug)
      .single()

    if (courseError || !course) {
      return NextResponse.json({ isPurchased: false })
    }

    const enrollment = await resolveCourseEnrollment(
      supabase,
      currentUser.id,
      course.id,
      organizationId,
    )

    if (enrollment) {
      return NextResponse.json({ isPurchased: true })
    }

    if (!organizationId) {
      return NextResponse.json({ isPurchased: false })
    }

    const { data: assignment } = await supabase
      .from('organization_course_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', currentUser.id)
      .eq('course_id', course.id)
      .or('status.is.null,status.neq.cancelled')
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ isPurchased: Boolean(assignment) })
  } catch {
    return NextResponse.json({ isPurchased: false })
  }
}
