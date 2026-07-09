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
import { ensureCourseEnrollmentScope } from '@/features/courses/services/course-enrollment.server.service'
// Reused to resolve learning-path course access exactly like the dashboard does,
// so the "New note" picker only offers courses the user is really assigned.
import { loadBusinessUserLearningPaths } from '@/features/learning-paths/services/learning-path-dashboard.server'
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
  type CompendiumNoteRow,
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

// Compendium notes have lesson_id null: the lesson chain is a LEFT join and
// the course is also resolved through the direct FK (explicit name required —
// the table now has two relationship paths to courses).
const COMPENDIUM_TREE_SELECT = `
  note_id, note_title, note_tags, source_type, is_auto_generated, created_at, updated_at,
  course_id,
  courses!user_lesson_notes_course_id_fkey( id, title, slug )
`

const DETAIL_SELECT = `
  note_id, note_title, note_content, note_tags, source_type, is_auto_generated,
  created_at, updated_at, user_id, lesson_id, organization_id,
  course_lessons(
    lesson_id, lesson_title,
    course_modules!inner(
      course_id,
      courses!inner( id, title, slug )
    )
  ),
  compendium_course:courses!user_lesson_notes_course_id_fkey( id, title, slug )
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

  const [lessonNotes, compendiums] = await Promise.all([
    supabase
      .from('user_lesson_notes')
      .select(TREE_SELECT)
      .eq('user_id', params.userId)
      .eq('organization_id', params.organizationId)
      .not('lesson_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(2000),
    supabase
      .from('user_lesson_notes')
      .select(COMPENDIUM_TREE_SELECT)
      .eq('user_id', params.userId)
      .eq('organization_id', params.organizationId)
      .eq('source_type', 'course_compendium')
      .order('updated_at', { ascending: false })
      .limit(200),
  ])

  if (lessonNotes.error) {
    throw new Error(
      `Error al obtener el árbol de apuntes: ${lessonNotes.error.message}`,
    )
  }
  if (compendiums.error) {
    throw new Error(
      `Error al obtener los compendios: ${compendiums.error.message}`,
    )
  }

  return buildNotebookTree(
    (lessonNotes.data ?? []) as unknown as TreeNoteRow[],
    (compendiums.data ?? []) as unknown as CompendiumNoteRow[],
  )
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

  // Independent operations → run in parallel to cut latency on note creation.
  // ensureCourseEnrollmentScope verifies real access (direct assignment, learning
  // path or purchase) and resolves-or-creates the enrollment; it returns null
  // when the user has no legitimate access, so a non-assigned course is rejected.
  const [, enrollment] = await Promise.all([
    assertLessonBelongsToCourse(supabase, lessonId, courseId),
    ensureCourseEnrollmentScope(
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

  // Compendiums are generated by SofLIA and read-only: excluded from the
  // update filter so a crafted PUT can never overwrite them.
  const { data, error } = await supabase
    .from('user_lesson_notes')
    .update(updateData)
    .eq('note_id', params.noteId)
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)
    .neq('source_type', 'course_compendium')
    .select('note_id')
    .maybeSingle()

  if (error) {
    throw new Error(`Error al actualizar la nota: ${error.message}`)
  }
  if (!data) {
    const { data: readOnlyNote } = await supabase
      .from('user_lesson_notes')
      .select('note_id')
      .eq('note_id', params.noteId)
      .eq('user_id', params.userId)
      .eq('organization_id', params.organizationId)
      .eq('source_type', 'course_compendium')
      .maybeSingle()

    if (readOnlyNote) {
      throw new NotebookError(
        'El compendio se genera automáticamente y no se puede editar.',
        422,
      )
    }
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

interface CourseRow {
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
}

/**
 * Resolves the course IDs the user actually has assigned in this organization:
 * direct assignments (organization_course_assignments) UNION learning-path
 * courses. This mirrors the dashboard's source of truth — raw enrollments are
 * NOT used, because an enrollment can exist for a course that is no longer
 * assigned (which would otherwise leak into the "New note" picker).
 */
async function resolveAssignedCourseIds(
  supabase: AdminClient,
  userId: string,
  organizationId: string,
): Promise<Set<string>> {
  const [directAssignments, learningPaths] = await Promise.all([
    supabase
      .from('organization_course_assignments')
      .select('course_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .in('status', ['assigned', 'in_progress', 'completed']),
    loadBusinessUserLearningPaths({ userId, organizationId }).catch(() => []),
  ])

  const courseIds = new Set<string>()
  for (const row of directAssignments.data ?? []) {
    if (row.course_id) courseIds.add(row.course_id)
  }
  for (const path of learningPaths) {
    for (const item of path.items) {
      if (item.courseId) courseIds.add(item.courseId)
    }
  }
  return courseIds
}

/**
 * Lists the courses the user is assigned in this org (direct + learning path),
 * with their published lessons, for the "New note" picker.
 */
export async function fetchNotebookCourseOptions(params: {
  userId: string
  organizationId: string
}): Promise<NotebookCourseOption[]> {
  const supabase = createAdminClient()

  const assignedCourseIds = await resolveAssignedCourseIds(
    supabase,
    params.userId,
    params.organizationId,
  )
  if (assignedCourseIds.size === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('courses')
    .select(
      `
      id, title, slug, is_active,
      course_modules(
        module_order_index,
        course_lessons( lesson_id, lesson_title, lesson_order_index, is_published )
      )
    `,
    )
    .in('id', Array.from(assignedCourseIds))
    .eq('is_active', true)

  if (error) {
    throw new Error(`Error al obtener cursos: ${error.message}`)
  }

  const rows = (data ?? []) as unknown as CourseRow[]
  const options: NotebookCourseOption[] = []

  for (const course of rows) {
    if (course.is_active === false) continue

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
