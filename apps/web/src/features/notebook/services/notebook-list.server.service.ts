import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import type { Json } from '@/lib/supabase/types'

import type {
  NotebookKnowledgeType,
  NotebookLifecycleStatus,
  NotebookNoteListItem,
  NotebookNoteSource,
} from '../types'
import { stripHtmlToText } from './notebook-enrichment.normalizer'
import {
  decodeNotebookCursor,
  encodeNotebookCursor,
  normalizeNotebookPageSize,
} from './notebook-pagination'
import { toNoteDetail, type DetailRow } from './notebook-tree.builder'

type AdminClient = ReturnType<typeof createAdminClient>

const LIST_SELECT = `
  note_id, note_title, note_content, note_tags, source_type, is_auto_generated,
  created_at, updated_at, user_id, lesson_id, organization_id, course_id,
  course_lessons(
    lesson_id, lesson_title,
    course_modules!inner(
      course_id,
      courses!inner( id, title, slug )
    )
  ),
  compendium_course:courses!user_lesson_notes_course_id_fkey( id, title, slug )
`

interface MetadataListRow {
  note_id: string
  knowledge_type: string
  lifecycle_status: string
}

interface CourseLessonIdsRow {
  course_lessons: Array<{ lesson_id: string }> | null
}

export interface ListNotebookNotesInput {
  courseId?: string
  cursor?: string | null
  knowledgeType?: NotebookKnowledgeType
  lessonId?: string
  lifecycleStatus?: NotebookLifecycleStatus
  limit?: number
  query?: string
  source?: NotebookNoteSource
}

function safeSearchPattern(value: string): string {
  return value.replace(/[,%_()\\]/g, ' ').replace(/\s+/g, ' ').trim()
}

async function resolveCourseLessonIds(
  client: AdminClient,
  courseId: string,
): Promise<string[]> {
  const { data, error } = await client
    .from('course_modules')
    .select('course_lessons(lesson_id)')
    .eq('course_id', courseId)

  if (error) {
    throw new Error(`Error al resolver las lecciones del curso: ${error.message}`)
  }

  return ((data ?? []) as CourseLessonIdsRow[]).flatMap((module) =>
    (module.course_lessons ?? []).map((lesson) => lesson.lesson_id),
  )
}

export async function listNotebookNotes(params: {
  client?: AdminClient
  filters: ListNotebookNotesInput
  organizationId: string
  userId: string
}): Promise<{ notes: NotebookNoteListItem[]; nextCursor: string | null }> {
  const client = params.client ?? createAdminClient()
  const limit = normalizeNotebookPageSize(params.filters.limit)
  const offset = decodeNotebookCursor(params.filters.cursor)

  let metadataIds: string[] | null = null
  if (params.filters.knowledgeType || params.filters.lifecycleStatus) {
    let metadataQuery = fromLoose<MetadataListRow>(
      client,
      'notebook_note_metadata',
    )
      .select('note_id, knowledge_type, lifecycle_status')
      .eq('user_id', params.userId)
      .eq('organization_id', params.organizationId)

    if (params.filters.knowledgeType) {
      metadataQuery = metadataQuery.eq(
        'knowledge_type',
        params.filters.knowledgeType,
      )
    }
    if (params.filters.lifecycleStatus) {
      metadataQuery = metadataQuery.eq(
        'lifecycle_status',
        params.filters.lifecycleStatus,
      )
    }

    const metadataResult = await metadataQuery.limit(5000)
    if (metadataResult.error) {
      throw new Error(
        `Error al filtrar metadatos de apuntes: ${metadataResult.error.message}`,
      )
    }
    metadataIds = (metadataResult.data ?? []).map((row) => row.note_id)
    if (metadataIds.length === 0) {
      return { notes: [], nextCursor: null }
    }
  }

  let noteQuery = fromLoose<DetailRow>(client, 'user_lesson_notes')
    .select(LIST_SELECT)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)

  if (metadataIds) noteQuery = noteQuery.in('note_id', metadataIds)
  if (params.filters.lessonId) {
    noteQuery = noteQuery.eq('lesson_id', params.filters.lessonId)
  }
  if (params.filters.source) {
    noteQuery = noteQuery.eq('source_type', params.filters.source)
  }
  if (params.filters.courseId) {
    const lessonIds = await resolveCourseLessonIds(client, params.filters.courseId)
    noteQuery = lessonIds.length
      ? noteQuery.or(
          `course_id.eq.${params.filters.courseId},lesson_id.in.(${lessonIds.join(',')})`,
        )
      : noteQuery.eq('course_id', params.filters.courseId)
  }

  const searchPattern = params.filters.query
    ? safeSearchPattern(params.filters.query)
    : ''
  if (searchPattern) {
    noteQuery = noteQuery.or(
      `note_title.ilike.%${searchPattern}%,note_content.ilike.%${searchPattern}%`,
    )
  }

  const noteResult = await noteQuery
    .order('updated_at', { ascending: false })
    .order('note_id', { ascending: false })
    .range(offset, offset + limit)

  if (noteResult.error) {
    throw new Error(`Error al listar apuntes: ${noteResult.error.message}`)
  }

  const rows = noteResult.data ?? []
  const pageRows = rows.slice(0, limit)
  const noteIds = pageRows.map((row) => row.note_id)
  const metadataByNoteId = new Map<string, MetadataListRow>()

  if (noteIds.length > 0) {
    const metadataResult = await fromLoose<MetadataListRow>(
      client,
      'notebook_note_metadata',
    )
      .select('note_id, knowledge_type, lifecycle_status')
      .eq('user_id', params.userId)
      .eq('organization_id', params.organizationId)
      .in('note_id', noteIds)

    if (metadataResult.error) {
      throw new Error(
        `Error al cargar metadatos de apuntes: ${metadataResult.error.message}`,
      )
    }
    for (const metadata of metadataResult.data ?? []) {
      metadataByNoteId.set(metadata.note_id, metadata)
    }
  }

  const notes = pageRows.map((row) => {
    const detail = toNoteDetail({
      ...row,
      note_tags: row.note_tags as Json,
    })
    const metadata = metadataByNoteId.get(detail.noteId)
    return {
      noteId: detail.noteId,
      title: detail.title,
      tags: detail.tags,
      source: detail.source,
      isAutoGenerated: detail.isAutoGenerated,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      contentPreview: stripHtmlToText(detail.content).slice(0, 240),
      courseId: detail.courseId,
      courseTitle: detail.courseTitle,
      lessonId: detail.lessonId || null,
      lessonTitle: detail.lessonTitle || null,
      knowledgeType:
        (metadata?.knowledge_type as NotebookKnowledgeType | undefined) ?? null,
      lifecycleStatus:
        (metadata?.lifecycle_status as NotebookLifecycleStatus | undefined) ??
        null,
    }
  })

  return {
    notes,
    nextCursor:
      rows.length > limit ? encodeNotebookCursor(offset + limit) : null,
  }
}

