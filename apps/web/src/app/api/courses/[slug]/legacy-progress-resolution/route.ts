import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { SessionService } from '@/features/auth/services/session.service'
import {
  claimLegacyProgressForOrganization,
  getLegacyProgressResolution,
} from '@/features/courses/services/legacy-progress-resolution.server.service'
import { createAdminClient } from '@/lib/supabase/admin'

const claimSchema = z.object({
  organizationId: z.string().uuid(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const currentUser = await SessionService.getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const { slug } = await params
  const supabase = createAdminClient()
  const resolution = await getLegacyProgressResolution({
    slug,
    supabase,
    userId: currentUser.id,
  })

  if (!resolution) {
    return NextResponse.json({ error: 'COURSE_NOT_FOUND' }, { status: 404 })
  }

  return NextResponse.json(resolution)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const currentUser = await SessionService.getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 })
  }

  const parsedBody = claimSchema.safeParse(await request.json().catch(() => null))

  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'INVALID_REQUEST', issues: parsedBody.error.flatten() },
      { status: 400 },
    )
  }

  try {
    const { slug } = await params
    const supabase = createAdminClient()
    const result = await claimLegacyProgressForOrganization({
      organizationId: parsedBody.data.organizationId,
      slug,
      supabase,
      userId: currentUser.id,
    })

    if (!result) {
      return NextResponse.json({ error: 'ORGANIZATION_NOT_AVAILABLE' }, { status: 403 })
    }

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        error: 'LEGACY_PROGRESS_CLAIM_FAILED',
        message: error instanceof Error ? error.message : 'No fue posible mover el progreso.',
      },
      { status: 500 },
    )
  }
}
