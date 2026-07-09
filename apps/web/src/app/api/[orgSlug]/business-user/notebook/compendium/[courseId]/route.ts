import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/rate-limit/rate-limit.check'
import { RateLimitTier } from '@/lib/rate-limit/rate-limit.types'
import { generateCourseCompendium } from '@/features/courses/services/course-compendium.service'
import { fetchNotebookNote } from '@/features/notebook/services/notebook.server.service'
import type { NotebookNoteResponse } from '@/features/notebook/types'
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

/**
 * POST /api/[orgSlug]/business-user/notebook/compendium/[courseId]
 * Regenerates the SofLIA course compendium for a completed course, so notes
 * added after completion get included. Rate limited (Gemini cost).
 */
export async function POST(_request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, courseId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const parsedCourseId = compendiumCourseIdSchema.safeParse(courseId)
    if (!parsedCourseId.success) {
      return NextResponse.json(
        { success: false, error: 'Curso inválido.' },
        { status: 422 },
      )
    }

    const rateLimit = checkRateLimit(
      `compendium:${auth.userId}`,
      RateLimitTier.AI_GENERATION,
    )
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Demasiadas regeneraciones. Intenta de nuevo en unos minutos.',
          retryAfter: rateLimit.retryAfter,
        },
        { status: 429 },
      )
    }

    const supabase = createAdminClient()
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('user_course_enrollments')
      .select('enrollment_id, enrollment_status, overall_progress_percentage')
      .eq('user_id', auth.userId)
      .eq('course_id', parsedCourseId.data)
      .eq('organization_id', auth.organizationId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<CompletedEnrollmentRow>()

    if (enrollmentError) {
      throw new Error(`Error consultando inscripción: ${enrollmentError.message}`)
    }

    const isCompleted =
      enrollment !== null &&
      (enrollment.enrollment_status === 'completed' ||
        enrollment.overall_progress_percentage === 100)
    if (!enrollment || !isCompleted) {
      return NextResponse.json(
        { success: false, error: 'Aún no has completado este curso.' },
        { status: 422 },
      )
    }

    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', parsedCourseId.data)
      .maybeSingle<{ title: string }>()

    const result = await generateCourseCompendium({
      allowUpdate: true,
      courseId: parsedCourseId.data,
      courseTitle: course?.title || 'Curso',
      enrollmentId: enrollment.enrollment_id,
      organizationId: auth.organizationId,
      userId: auth.userId,
    })

    if (result.status === 'failed' || !result.noteId) {
      return NextResponse.json(
        { success: false, error: 'No se pudo regenerar el compendio.' },
        { status: 500 },
      )
    }

    const note = await fetchNotebookNote({
      userId: auth.userId,
      organizationId: auth.organizationId,
      noteId: result.noteId,
      client: supabase,
    })

    return NextResponse.json({ note } satisfies NotebookNoteResponse)
  } catch (error) {
    return notebookErrorResponse(error, 'compendium POST')
  }
}
