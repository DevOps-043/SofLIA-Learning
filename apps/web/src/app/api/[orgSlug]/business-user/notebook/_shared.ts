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

const notebookChatProvenanceSchema = z.object({
  conversationId: z.string().uuid(),
  userMessageId: z.string().uuid().optional(),
  assistantMessageId: z.string().uuid().optional(),
})

export const createNoteSchema = z
  .object({
    courseId: z.string().uuid(),
    lessonId: z.string().uuid(),
    title: z.string().max(NOTEBOOK_MAX_TITLE_LENGTH).optional(),
    content: z.string().max(CONTENT_MAX).optional(),
    tags: tagsSchema.optional(),
    source: z.enum(['manual', 'chat', 'import']).optional().default('manual'),
    chatProvenance: notebookChatProvenanceSchema.optional(),
  })
  .superRefine((body, context) => {
    if (body.source === 'chat' && !body.chatProvenance) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CHAT_PROVENANCE_REQUIRED',
        path: ['chatProvenance'],
      })
    }
    if (body.source !== 'chat' && body.chatProvenance) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CHAT_PROVENANCE_NOT_ALLOWED',
        path: ['chatProvenance'],
      })
    }
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

export const compendiumCourseIdSchema = z.string().uuid()

/** Users may confirm/complete/reopen/dismiss — never reset to 'suggested'. */
export const updateDerivedTaskSchema = z.object({
  status: z.enum(['open', 'done', 'dismissed']),
})

const notebookSourceSchema = z.enum([
  'manual',
  'chat',
  'import',
  'lesson_auto_note',
  'course_compendium',
])
const knowledgeTypeSchema = z.enum([
  'note',
  'reflection',
  'decision',
  'qa',
  'resource',
  'evidence',
])
const lifecycleStatusSchema = z.enum([
  'draft',
  'enriched',
  'reviewed',
  'archived',
  'shared',
  'promoted',
])

export const listNotebookNotesQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  cursor: z.string().max(200).optional(),
  knowledgeType: knowledgeTypeSchema.optional(),
  lessonId: z.string().uuid().optional(),
  lifecycleStatus: lifecycleStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().trim().max(120).optional(),
  source: notebookSourceSchema.optional(),
})

export const listNotebookTasksQuerySchema = z.object({
  courseId: z.string().uuid().optional(),
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z.enum(['suggested', 'open', 'done', 'dismissed']).optional(),
})

const enrichmentOverridesSchema = z.object({
  summary: z.string().trim().max(4000).nullable().optional(),
  keyConcepts: z.array(z.string().trim().min(1).max(160)).max(50).optional(),
  suggestedTags: tagsSchema.optional(),
  knowledgeType: knowledgeTypeSchema.optional(),
})

export const reviewNoteEnrichmentSchema = z
  .object({
    action: z.enum(['accept', 'edit', 'dismiss']),
    overrides: enrichmentOverridesSchema.optional(),
  })
  .superRefine((body, context) => {
    if (
      body.action === 'edit' &&
      (!body.overrides || Object.keys(body.overrides).length === 0)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ENRICHMENT_OVERRIDES_REQUIRED',
        path: ['overrides'],
      })
    }
    if (body.action === 'dismiss' && body.overrides) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ENRICHMENT_OVERRIDES_NOT_ALLOWED',
        path: ['overrides'],
      })
    }
  })

export type CreateNoteBody = z.infer<typeof createNoteSchema>
export type UpdateNoteBody = z.infer<typeof updateNoteSchema>
export type UpdateDerivedTaskBody = z.infer<typeof updateDerivedTaskSchema>
export type ReviewNoteEnrichmentBody = z.infer<
  typeof reviewNoteEnrichmentSchema
>
