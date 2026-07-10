import { NextResponse } from 'next/server'
import { z } from 'zod'

import { resolveQueuedJobState } from '@/features/notebook/services/notebook-generation.helpers'
import { enqueueLessonAutoNoteJob } from '@/features/notebook/services/notebook-generation.server.service'
import type { NotebookGenerationMutationResponse } from '@/features/notebook/types'
import { createAdminClient } from '@/lib/supabase/admin'

import { notebookErrorResponse, resolveNotebookAuth } from '../../../../_shared'

const bodySchema = z.object({ courseId: z.string().uuid() })

export async function POST(
  request: Request,
  {
    params,
  }: { params: Promise<{ orgSlug: string; lessonId: string }> },
) {
  try {
    const { orgSlug, lessonId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success || !z.string().uuid().safeParse(lessonId).success) {
      return NextResponse.json({ error: 'Solicitud inválida.' }, { status: 422 })
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

    const job = await enqueueLessonAutoNoteJob({
      client,
      courseId: parsed.data.courseId,
      enrollmentId: enrollment.enrollment_id,
      lessonId,
      organizationId: auth.organizationId,
      priority: 40,
      sourceVersion: `manual:${new Date().toISOString()}`,
      userId: auth.userId,
    })
    return NextResponse.json(
      { state: resolveQueuedJobState(job) } satisfies NotebookGenerationMutationResponse,
      { status: 202 },
    )
  } catch (error) {
    return notebookErrorResponse(error, 'lesson generation retry POST')
  }
}
