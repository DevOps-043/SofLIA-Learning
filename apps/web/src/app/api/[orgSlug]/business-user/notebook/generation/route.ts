import { NextResponse } from 'next/server'
import { z } from 'zod'

import { fetchNotebookGenerationState } from '@/features/notebook/services/notebook-generation.server.service'
import type { NotebookGenerationResponse } from '@/features/notebook/types'
import { createAdminClient } from '@/lib/supabase/admin'

import { notebookErrorResponse, resolveNotebookAuth } from '../_shared'

const querySchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth
    const parsed = querySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    )
    if (!parsed.success) {
      return NextResponse.json({ error: 'Consulta inválida.' }, { status: 422 })
    }

    const client = createAdminClient()
    const { data: enrollment, error } = await client
      .from('user_course_enrollments')
      .select('enrollment_id')
      .eq('user_id', auth.userId)
      .eq('organization_id', auth.organizationId)
      .eq('course_id', parsed.data.courseId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle<{ enrollment_id: string }>()
    if (error) throw new Error(error.message)
    if (!enrollment) {
      return NextResponse.json({ error: 'Inscripción no encontrada.' }, { status: 404 })
    }

    const [lesson, compendium] = await Promise.all([
      parsed.data.lessonId
        ? fetchNotebookGenerationState({
            client,
            courseId: parsed.data.courseId,
            enrollmentId: enrollment.enrollment_id,
            jobType: 'lesson_auto_note',
            lessonId: parsed.data.lessonId,
            organizationId: auth.organizationId,
            userId: auth.userId,
          })
        : Promise.resolve(null),
      fetchNotebookGenerationState({
        client,
        courseId: parsed.data.courseId,
        enrollmentId: enrollment.enrollment_id,
        jobType: 'course_compendium',
        lessonId: null,
        organizationId: auth.organizationId,
        userId: auth.userId,
      }),
    ])
    const response: NotebookGenerationResponse = {
      ...(lesson ? { lesson } : {}),
      ...(compendium ? { compendium } : {}),
    }
    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    return notebookErrorResponse(error, 'generation GET')
  }
}
