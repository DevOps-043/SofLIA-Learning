import { NextResponse } from 'next/server'

import { enqueueCourseCompletionNotebookJobs } from '@/features/notebook/services/notebook-generation.server.service'
import type { NotebookGenerationMutationResponse } from '@/features/notebook/types'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit.check'
import { RateLimitTier } from '@/lib/rate-limit/rate-limit.types'

import {
  compendiumCourseIdSchema,
  notebookErrorResponse,
  resolveNotebookAuth,
} from '../../_shared'

type RouteContext = { params: Promise<{ orgSlug: string; courseId: string }> }

interface CompletedEnrollmentRow {
  enrollment_id: string
  enrollment_status: string | null
  overall_progress_percentage: number | null
}

/** Enqueues missing lesson notes and one idempotent course compendium. */
export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const { orgSlug, courseId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const parsedCourseId = compendiumCourseIdSchema.safeParse(courseId)
    if (!parsedCourseId.success) {
      return NextResponse.json({ error: 'Curso inválido.' }, { status: 422 })
    }
    const rateLimit = checkRateLimit(
      `compendium:${auth.userId}`,
      RateLimitTier.AI_GENERATION,
    )
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes.', retryAfter: rateLimit.retryAfter },
        { status: 429 },
      )
    }

    const client = createAdminClient()
    const { data: enrollment, error } = await client
      .from('user_course_enrollments')
      .select('enrollment_id, enrollment_status, overall_progress_percentage')
      .eq('user_id', auth.userId)
      .eq('course_id', parsedCourseId.data)
      .eq('organization_id', auth.organizationId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<CompletedEnrollmentRow>()
    if (error) throw new Error(error.message)
    if (
      !enrollment ||
      (enrollment.enrollment_status !== 'completed' &&
        enrollment.overall_progress_percentage !== 100)
    ) {
      return NextResponse.json(
        { error: 'Aún no has completado este curso.' },
        { status: 422 },
      )
    }

    // Regenerar es una acción explícita del usuario: descongela el compendio
    // (is_user_edited=false) para que el worker lo reconstruya y la vista viva
    // vuelva a componerse. La regeneración automática (fin de curso) no pasa por
    // aquí, así que un compendio editado no se sobrescribe solo.
    await client
      .from('user_lesson_notes')
      .update({ is_user_edited: false })
      .eq('user_id', auth.userId)
      .eq('organization_id', auth.organizationId)
      .eq('course_id', parsedCourseId.data)
      .eq('enrollment_id', enrollment.enrollment_id)
      .eq('source_type', 'course_compendium')

    const queued = await enqueueCourseCompletionNotebookJobs({
      client,
      courseId: parsedCourseId.data,
      enrollmentId: enrollment.enrollment_id,
      organizationId: auth.organizationId,
      sourceVersion: `manual:${new Date().toISOString()}`,
      userId: auth.userId,
    })
    return NextResponse.json(
      { state: queued.compendium.state } satisfies NotebookGenerationMutationResponse,
      { status: 202 },
    )
  } catch (error) {
    return notebookErrorResponse(error, 'compendium POST')
  }
}
