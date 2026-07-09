import { NextRequest, NextResponse } from 'next/server'

import { updateDerivedTaskStatus } from '@/features/notebook/services/notebook-enrichment.server.service'
import type { NotebookDerivedTaskResponse } from '@/features/notebook/types'
import {
  notebookErrorResponse,
  resolveNotebookAuth,
  updateDerivedTaskSchema,
} from '../../_shared'

type RouteContext = { params: Promise<{ orgSlug: string; taskId: string }> }

/**
 * PATCH /api/[orgSlug]/business-user/notebook/tasks/[taskId]
 * Confirms ('open'), completes ('done'), reopens or dismisses a derived task
 * owned by the user in this org.
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { orgSlug, taskId } = await params
    const auth = await resolveNotebookAuth(orgSlug)
    if (auth instanceof NextResponse) return auth

    const json = await request.json().catch(() => null)
    const parsed = updateDerivedTaskSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Estado de tarea inválido.' },
        { status: 422 },
      )
    }

    const task = await updateDerivedTaskStatus({
      userId: auth.userId,
      organizationId: auth.organizationId,
      taskId,
      status: parsed.data.status,
    })

    return NextResponse.json({ task } satisfies NotebookDerivedTaskResponse)
  } catch (error) {
    return notebookErrorResponse(error, 'task PATCH')
  }
}
