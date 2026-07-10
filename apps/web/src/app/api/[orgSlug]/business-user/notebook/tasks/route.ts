import { NextRequest, NextResponse } from 'next/server'

import { listNotebookDerivedTasks } from '@/features/notebook/services/notebook-tasks.server.service'
import type { NotebookDerivedTaskListResponse } from '@/features/notebook/types'
import {
  listNotebookTasksQuerySchema,
  notebookErrorResponse,
  resolveNotebookAuth,
} from '../_shared'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> },
) {
  try {
    const { orgSlug } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const parsed = listNotebookTasksQuerySchema.safeParse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    )
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Filtros de tareas inválidos.' },
        { status: 422 },
      )
    }

    const result = await listNotebookDerivedTasks({
      courseId: parsed.data.courseId,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
      organizationId: auth.organizationId,
      status: parsed.data.status,
      userId: auth.userId,
    })

    return NextResponse.json(result satisfies NotebookDerivedTaskListResponse, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    return notebookErrorResponse(error, 'tasks GET')
  }
}

