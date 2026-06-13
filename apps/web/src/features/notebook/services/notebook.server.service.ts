/**
 * Notebook — Server Service
 *
 * Builds the Course -> Lesson -> Notes tree and performs note CRUD, ALWAYS
 * scoped to (userId, organizationId). Organization isolation is enforced on
 * every query and re-checked at object level on detail/update/delete to
 * prevent cross-organization access (IDOR).
 *
 * Reuses existing infrastructure:
 *  - resolveCourseEnrollment (org/enrollment resolution)
 *  - NoteService.createNote (insert)
 *  - sanitizeHtml (anti-XSS for stored HTML)
 *  - buildNotebookTree / toNoteDetail (pure mapping, separately tested)
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { sanitizeHtml } from '@/lib/sanitize/html-sanitizer.core'
import { NoteService } from '@/features/courses/services/note.service'
import { resolveCourseEnrollment } from '@/features/courses/services/course-enrollment.server.service'
import type { TablesUpdate } from '@/lib/supabase/types'
import {
  NOTEBOOK_EMPTY_CONTENT,
  NOTEBOOK_MAX_CONTENT_LENGTH,
  type CreateNotebookNoteInput,
  type NotebookCourseOption,
  type NotebookNoteDetail,
  type NotebookTree,
  type UpdateNotebookNoteInput,
} from '../types'
import {
  buildNotebookTree,
  toNoteDetail,
  type DetailRow,
  type TreeNoteRow,
} from './notebook-tree.builder'

type AdminClient = ReturnType<typeof createAdminClient>

/** Domain error carrying an HTTP status so routes can map it cleanly. */
export class NotebookError extends Error {
  constructor(
    message: string,
    public readonly status: 403 | 404 | 422 = 422,
  ) {
    super(message)
    this.name = 'NotebookError'
  }
}

const TREE_SELECT = `
  note_id, note_title, note_tags, source_type, is_auto_generated, created_at, updated_at,
  course_lessons!inner(
    lesson_id, lesson_title, lesson_order_index,
    course_modules!inner(
      course_id, module_order_index,
      courses!inner( id, title, slug )
    )
  )
`

const DETAIL_SELECT = `
  note_id, note_title, note_content, note_tags, source_type, is_auto_generated,
  created_at, updated_at, user_id, lesson_id, organization_id,
  course_lessons!inner(
    lesson_id, lesson_title,
    course_modules!inner(
      course_id,
      courses!inner( id, title, slug )
    )
  )
`

function sanitizeContent(content: string | undefined): string {
  const sanitized = sanitizeHtml(content ?? '', {
    level: 'rich',
    maxLength: NOTEBOOK_MAX_CONTENT_LENGTH,
  }).trim()
  return sanitized || NOTEBOOK_EMPTY_CONTENT
}

/**
 * Builds the org-scoped Course -> Lesson -> Notes tree for a user.
 * Single nested query (no N+1); grouping/ordering delegated to buildNotebookTree.
 */
export async function fetchNotebookTree(params: {
  userId: string
  organizationId: string
  client?: AdminClient
}): Promise<NotebookTree> {
  const supabase = params.client ?? createAdminClient()

  const { data, error } = await supabase
    .from('user_lesson_notes')
    .select(TREE_SELECT)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .order('updated_at', { ascending: false })
    .limit(2000)

  if (error) {
    throw new Error(`Error al obtener el árbol de apuntes: ${error.message}`)
  }

  return buildNotebookTree((data ?? []) as unknown as TreeNoteRow[])
}

/**
 * Fetches a single note with object-level org/owner validation.
 * Returns the note only if it belongs to (userId, organizationId).
 */
export async function fetchNotebookNote(params: {
  userId: string
  organizationId: string
  noteId: string
  client?: AdminClient
}): Promise<NotebookNoteDetail> {
  const supabase = params.client ?? createAdminClient()

  const { data, error } = await supabase
    .from('user_lesson_notes')
    .select(DETAIL_SELECT)
    .eq('note_id', params.noteId)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .maybeSingle()

  if (error) {
    throw new Error(`Error al obtener la nota: ${error.message}`)
  }
  if (!data) {
    throw new NotebookError('Nota no encontrada.', 404)
  }

  return toNoteDetail(data as unknown as DetailRow)
}

/** Verifies the lesson exists and belongs to the given course. */
async function assertLessonBelongsToCourse(
  supabase: AdminClient,
  lessonId: string,
  courseId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('course_lessons')
    .select('lesson_id, course_modules!inner(course_id)')
    .eq('lesson_id', lessonId)
    .maybeSingle()

  if (error) {
    throw new Error(`Error al validar la lección: ${error.message}`)
  }

  const moduleCourseId = (
    data as unknown as { course_modules: { course_id: string } | null } | null
  )?.course_modules?.course_id

  if (!data || moduleCourseId !== courseId) {
    throw new NotebookError('La lección no pertenece al curso indicado.', 422)
  }
}

/**
 * Creates a note tied to a lesson, scoped to the user's organization.
 * Requires a valid enrollment in that org (otherwise 403).
 */
export async function createNotebookNote(params: {
  userId: string
  organizationId: string
  input: CreateNotebookNoteInput
}): Promise<NotebookNoteDetail> {
  const supabase = createAdminClient()
  const { courseId, lessonId } = params.input

  // Independent reads → run in parallel to cut latency on note creation.
  const [, enrollment] = await Promise.all([
    assertLessonBelongsToCourse(supabase, lessonId, courseId),
    resolveCourseEnrollment(
      supabase,
      params.userId,
      courseId,
      params.organizationId,
    ),
  ])
  if (!enrollment) {
    throw new NotebookError(
      'No tienes acceso a este curso en tu organización.',
      403,
    )
  }

  const content = sanitizeContent(params.input.content)
  const title = params.input.title?.trim() || 'Nueva nota'
  const tags = (params.input.tags ?? [])
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

  const created = await NoteService.createNote(params.userId, lessonId, {
    note_title: title,
    note_content: content,
    note_tags: tags,
    organization_id: params.organizationId,
    enrollment_id: enrollment.enrollment_id,
    source_type: 'manual',
  })

  return fetchNotebookNote({
    userId: params.userId,
    organizationId: params.organizationId,
    noteId: created.note_id,
    client: supabase,
  })
}

/**
 * Updates a note atomically, filtering by note_id + user_id + organization_id
 * so a note from another org can never be mutated.
 */
export async function updateNotebookNote(params: {
  userId: string
  organizationId: string
  noteId: string
  input: UpdateNotebookNoteInput
}): Promise<NotebookNoteDetail> {
  const supabase = createAdminClient()

  const updateData: TablesUpdate<'user_lesson_notes'> = {
    updated_at: new Date().toISOString(),
  }
  if (params.input.title !== undefined) {
    updateData.note_title = params.input.title.trim() || 'Nueva nota'
  }
  if (params.input.content !== undefined) {
    updateData.note_content = sanitizeContent(params.input.content)
  }
  if (params.input.tags !== undefined) {
    updateData.note_tags = params.input.tags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  const { data, error } = await supabase
    .from('user_lesson_notes')
    .update(updateData)
    .eq('note_id', params.noteId)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .select('note_id')
    .maybeSingle()

  if (error) {
    throw new Error(`Error al actualizar la nota: ${error.message}`)
  }
  if (!data) {
    throw new NotebookError('Nota no encontrada.', 404)
  }

  return fetchNotebookNote({
    userId: params.userId,
    organizationId: params.organizationId,
    noteId: params.noteId,
    client: supabase,
  })
}

/** Deletes a note atomically, scoped to user + organization. */
export async function deleteNotebookNote(params: {
  userId: string
  organizationId: string
  noteId: string
}): Promise<void> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_lesson_notes')
    .delete()
    .eq('note_id', params.noteId)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .select('note_id')
    .maybeSingle()

  if (error) {
    throw new Error(`Error al eliminar la nota: ${error.message}`)
  }
  if (!data) {
    throw new NotebookError('Nota no encontrada.', 404)
  }
}

interface CourseOptionRow {
  course_id: string
  courses: {
    id: string
    title: string
    slug: string | null
    is_active: boolean | null
    course_modules: Array<{
      module_order_index: number | null
      course_lessons: Array<{
        lesson_id: string
        lesson_title: string
        lesson_order_index: number | null
        is_published: boolean | null
      }>
    }>
  } | null
}

/**
 * Lists the user's enrolled courses (in this org) with their lessons, for the
 * "New note" picker. Scoped via user_course_enrollments.organization_id.
 */
export async function fetchNotebookCourseOptions(params: {
  userId: string
  organizationId: string
}): Promise<NotebookCourseOption[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('user_course_enrollments')
    .select(
      `
      course_id,
      courses!inner(
        id, title, slug, is_active,
        course_modules(
          module_order_index,
          course_lessons( lesson_id, lesson_title, lesson_order_index, is_published )
        )
      )
    `,
    )
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)

  if (error) {
    throw new Error(`Error al obtener cursos: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as CourseOptionRow[]
  const seen = new Set<string>()
  const options: NotebookCourseOption[] = []

  for (const row of rows) {
    const course = row.courses
    if (!course || course.is_active === false || seen.has(course.id)) continue
    seen.add(course.id)

    const lessons = (course.course_modules ?? [])
      .flatMap((module) =>
        (module.course_lessons ?? []).map((lesson) => ({
          lessonId: lesson.lesson_id,
          title: lesson.lesson_title,
          orderIndex: lesson.lesson_order_index ?? 0,
          moduleOrder: module.module_order_index ?? 0,
          isPublished: lesson.is_published ?? true,
        })),
      )
      .filter((lesson) => lesson.isPublished)
      .sort((a, b) =>
        a.moduleOrder !== b.moduleOrder
          ? a.moduleOrder - b.moduleOrder
          : a.orderIndex - b.orderIndex,
      )
      .map(({ lessonId, title, orderIndex }) => ({ lessonId, title, orderIndex }))

    if (lessons.length === 0) continue

    options.push({
      courseId: course.id,
      title: course.title,
      slug: course.slug,
      lessons,
    })
  }

  return options.sort((a, b) => a.title.localeCompare(b.title))
}
