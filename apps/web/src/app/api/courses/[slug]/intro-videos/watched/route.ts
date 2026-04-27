import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { requireUser } from '@/lib/auth/requireUser'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface RouteParams {
  params: Promise<{ slug: string }>
}

const BodySchema = z.object({
  watchedCourse: z.boolean().optional(),
  watchedLp: z.boolean().optional(),
  learningPathId: z.string().uuid().optional(),
})

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

    const { watchedCourse, watchedLp, learningPathId } = parsed.data

    const supabase = await createClient()

    // Obtener course_id y organización del usuario
    const [courseResult, membershipResult] = await Promise.all([
      supabase.from('courses').select('id').eq('slug', slug).single(),
      supabase
        .from('organization_users')
        .select('organization_id')
        .eq('user_id', auth.userId)
        .eq('status', 'active')
        .limit(1)
        .single(),
    ])

    if (courseResult.error || !courseResult.data) {
      return NextResponse.json({ success: false, error: 'Curso no encontrado' }, { status: 404 })
    }

    const courseId = courseResult.data.id
    const organizationId = membershipResult.data?.organization_id ?? null

    const updates: Promise<unknown>[] = []
    const now = new Date().toISOString()

    if (watchedCourse) {
      updates.push(
        supabase
          .from('user_course_enrollments')
          .update({ course_intro_watched_at: now })
          .eq('user_id', auth.userId)
          .eq('course_id', courseId)
          .is('course_intro_watched_at', null)
          .then(({ error }) => {
            if (error) logger.error('Mark course intro watched error:', error)
          }),
      )
    }

    if (watchedLp && learningPathId) {
      updates.push(
        supabase
          .from('user_learning_path_progress')
          .update({ lp_intro_watched_at: now })
          .eq('user_id', auth.userId)
          .eq('learning_path_id', learningPathId)
          .is('lp_intro_watched_at', null)
          .then(({ error }) => {
            if (error) logger.error('Mark LP intro watched error:', error)
          }),
      )

      if (organizationId) {
        // Fallback: crear registro de progreso si no existe aún
        updates.push(
          supabase
            .from('user_learning_path_progress')
            .select('id')
            .eq('user_id', auth.userId)
            .eq('learning_path_id', learningPathId)
            .maybeSingle()
            .then(async ({ data }) => {
              if (!data) {
                const { error } = await supabase.from('user_learning_path_progress').insert({
                  user_id: auth.userId,
                  learning_path_id: learningPathId,
                  organization_id: organizationId,
                  lp_intro_watched_at: now,
                  completed_items_count: 0,
                  total_items_count: 0,
                  progress_percentage: 0,
                  status: 'not_started',
                })
                if (error) logger.error('Create LP progress for watched error:', error)
              }
            }),
        )
      }
    }

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('POST intro-videos watched error:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
