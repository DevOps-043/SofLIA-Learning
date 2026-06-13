/**
 * Shared helpers for the Notebook API routes.
 *
 * Centralizes the org-isolation guard, error mapping and Zod schemas so every
 * route enforces the same (userId, organizationId) scoping consistently.
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'

import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { logger } from '@/lib/utils/logger'
import { NotebookError } from '@/features/notebook/services/notebook.server.service'
import {
  NOTEBOOK_MAX_TAGS,
  NOTEBOOK_MAX_TITLE_LENGTH,
} from '@/features/notebook/types'

export interface NotebookAuthContext {
  userId: string
  organizationId: string
}

/**
 * Authenticates a BusinessUser for the given org slug and returns the scoped
 * identity, or a NextResponse to short-circuit (401/403). Never trust
 * client-provided org/user identifiers — always use this result.
 */
export async function resolveNotebookAuth(
  orgSlug: string,
): Promise<NotebookAuthContext | NextResponse> {
  const auth = await requireBusinessUser({ organizationSlug: orgSlug })
  if (auth instanceof NextResponse) return auth
  if (!auth.userId || !auth.organizationId) {
    return NextResponse.json(
      { success: false, error: 'No tienes una organización asignada.' },
      { status: 403 },
    )
  }
  return { userId: auth.userId, organizationId: auth.organizationId }
}

/** Maps service errors to safe HTTP responses (no internals leaked). */
export function notebookErrorResponse(
  error: unknown,
  context: string,
): NextResponse {
  if (error instanceof NotebookError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status },
    )
  }
  logger.error(`Notebook ${context} failed`, error)
  return NextResponse.json(
    { success: false, error: 'Error interno del servidor.' },
    { status: 500 },
  )
}

/** Pre-sanitize cap to bound payload size; sanitizer enforces the 50k limit. */
const CONTENT_MAX = 80_000
const TAG_MAX_LENGTH = 64

const tagsSchema = z.array(z.string().max(TAG_MAX_LENGTH)).max(NOTEBOOK_MAX_TAGS)

export const createNoteSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  title: z.string().max(NOTEBOOK_MAX_TITLE_LENGTH).optional(),
  content: z.string().max(CONTENT_MAX).optional(),
  tags: tagsSchema.optional(),
})

export const updateNoteSchema = z
  .object({
    title: z.string().max(NOTEBOOK_MAX_TITLE_LENGTH).optional(),
    content: z.string().max(CONTENT_MAX).optional(),
    tags: tagsSchema.optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.content !== undefined ||
      data.tags !== undefined,
    { message: 'No hay cambios para guardar.' },
  )

export type CreateNoteBody = z.infer<typeof createNoteSchema>
export type UpdateNoteBody = z.infer<typeof updateNoteSchema>
