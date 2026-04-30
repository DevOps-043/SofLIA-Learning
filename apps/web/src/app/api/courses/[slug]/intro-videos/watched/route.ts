import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/requireUser'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ slug: string }>
}

const BodySchema = z.object({
  watchedCourse: z.boolean().optional(),
  watchedLp: z.boolean().optional(),
  learningPathId: z.string().uuid().optional(),
  organizationId: z.string().uuid().optional(),
})

function isPlatformAdmin(role: string | null | undefined) {
  return role?.toLowerCase().trim() === 'administrador'
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params
    const auth = await requireUser()
    if (auth instanceof NextResponse) return auth

    const body = await request.json()
    const parsed = BodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Datos inválidos' }, { status: 400 })
    }

    const { watchedCourse, watchedLp, learningPathId, organizationId } = parsed.data
    if (!watchedCourse && !watchedLp) {
      return NextResponse.json({ success: true })
    }

    // Service role: bypasa RLS del auth personalizado
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const now = new Date().toISOString()

    const updates: Promise<unknown>[] = []
    let canUseRequestedOrganization = false

    if (organizationId) {
      if (isPlatformAdmin(auth.userRole)) {
        canUseRequestedOrganization = true
      } else {
        const { data: membership } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', auth.userId)
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .maybeSingle()

        canUseRequestedOrganization = Boolean(membership)
      }

      if (!canUseRequestedOrganization) {
        return NextResponse.json({ success: false, error: 'Organizacion no permitida' }, { status: 403 })
      }
    }

    if (watchedCourse) {
      // Resolver course_id desde slug
      const { data: course } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', slug)
        .single()

      if (course) {
        let updateQuery = supabase
          .from('user_course_enrollments')
          .update({ course_intro_watched_at: now })
          .eq('user_id', auth.userId)
          .eq('course_id', course.id)
          .is('course_intro_watched_at', null)

        if (organizationId) {
          updateQuery = updateQuery.eq('organization_id', organizationId)
        }

        updates.push(
          updateQuery.then(({ error }) => {
            if (error) logger.error('Mark course intro watched error:', error)
          }),
        )
      }
    }

    if (watchedLp && learningPathId) {
      // Intentar actualizar registro existente
      const { data: existing } = await supabase
        .from('user_learning_path_progress')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('learning_path_id', learningPathId)
        .maybeSingle()

      if (existing) {
        updates.push(
          supabase
            .from('user_learning_path_progress')
            .update({ lp_intro_watched_at: now })
            .eq('id', existing.id)
            .is('lp_intro_watched_at', null)
            .then(({ error }) => {
              if (error) logger.error('Mark LP intro watched error:', error)
            }),
        )
      } else {
        // Crear registro mínimo de progreso para guardar el watched
        const fallbackOrganizationId = organizationId
        let resolvedOrganizationId = fallbackOrganizationId

        if (!resolvedOrganizationId) {
          const { data: membership } = await supabase
            .from('organization_users')
            .select('organization_id')
            .eq('user_id', auth.userId)
            .eq('status', 'active')
            .limit(1)
            .single()

          resolvedOrganizationId = membership?.organization_id ?? undefined
        }

        if (resolvedOrganizationId) {
          updates.push(
            supabase
              .from('user_learning_path_progress')
              .insert({
                user_id: auth.userId,
                learning_path_id: learningPathId,
                organization_id: resolvedOrganizationId,
                lp_intro_watched_at: now,
                completed_items_count: 0,
                total_items_count: 0,
                progress_percentage: 0,
                status: 'not_started',
              })
              .then(({ error }) => {
                if (error) logger.error('Create LP progress for watched error:', error)
              }),
          )
        }
      }
    }

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('POST intro-videos watched error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
