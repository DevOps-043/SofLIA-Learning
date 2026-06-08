import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

import type {
  NotebookCourse,
  NotebookItem,
  NotebookManualNote,
  NotebookMutationResponse,
  NotebookNotesQueryParams,
  NotebookNotesResponse,
  NotebookSofliaSummary,
  NotebookUpdateNoteInput,
} from '../types'
import {
  decodeNotebookCursor,
  mergeNotebookSourcesPage,
  type NotebookCursor,
} from './notebook-pagination.service'
import { getNotebookEditableText } from './notebook-content-rendering.service'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50
const PREVIEW_LENGTH = 180
const MAX_TITLE_LENGTH = 160
const MAX_CONTENT_LENGTH = 100_000
const MAX_TAGS = 20

interface FetchNotesParams {
  supabase: SupabaseServerClient
  userId: string
  organizationId: string
  accessibleCourseIds: string[]
  courseIdFilter?: string
  cursor: NotebookCursor | null
  limit: number
}

interface NoteJoinRow {
  note_id: string
  note_title: string
  note_content: string
  note_tags: string[] | null
  is_auto_generated: boolean | null
  source_type: string | null
  created_at: string | null
  updated_at: string | null
  lesson_id: string
  organization_id: string | null
  course_lessons: {
    lesson_id: string
    lesson_title: string | null
    course_modules: {
      module_id: string
      module_title: string | null
      course_id: string
      courses: {
        id: string
        title: string | null
        thumbnail_url: string | null
      } | null
    } | null
  } | null
}

interface SummaryJoinRow {
  summary_id: string
  title: string
  content_html: string
  content_markdown: string
  status: string
  version: number
  module_id: string
  course_id: string
  organization_id: string | null
  generated_at: string | null
  created_at: string
  updated_at: string
}

interface CourseModuleRow {
  module_id: string
  module_title?: string | null
  course_id: string
}

interface CourseLessonRow {
  lesson_id: string
  module_id: string
  lesson_order_index?: number | null
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    // Insert a space before block-level closing tags so text from adjacent
    // blocks doesn't merge (e.g. "<h1>A</h1><h2>B</h2>" → "A B" not "AB").
    .replace(/<\/(?:p|div|section|article|li|h[1-6]|blockquote|tr|td|th|dt|dd|figcaption|summary|details)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|apos|gt|lt|nbsp|quot);/g, (entity) => {
      const entities: Record<string, string> = {
        '&amp;': '&',
        '&apos;': "'",
        '&gt;': '>',
        '&lt;': '<',
        '&nbsp;': ' ',
        '&quot;': '"',
      }
      return entities[entity] ?? entity
    })
    .trim()
}

function truncatePreview(text: string, maxLength: number = PREVIEW_LENGTH): string {
  const cleaned = stripHtmlTags(text).replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trimEnd()}...`
}

function clampLimit(rawLimit: number | undefined): number {
  const limit = rawLimit ?? DEFAULT_PAGE_SIZE
  return Math.max(1, Math.min(limit, MAX_PAGE_SIZE))
}

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return []

  const uniqueTags = new Set<string>()
  tags.forEach((tag) => {
    if (typeof tag !== 'string') return
    const normalized = tag.trim()
    if (normalized) uniqueTags.add(normalized)
  })

  return Array.from(uniqueTags).slice(0, MAX_TAGS)
}

function normalizeUpdateInput(input: NotebookUpdateNoteInput) {
  return {
    content: input.content.trim().slice(0, MAX_CONTENT_LENGTH),
    tags: normalizeTags(input.tags),
    title: input.title.trim().slice(0, MAX_TITLE_LENGTH),
  }
}

async function resolveAccessibleCourseIds(
  supabase: SupabaseServerClient,
  userId: string,
  organizationId: string,
): Promise<string[]> {
  const [enrollmentsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('user_course_enrollments')
      .select('course_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId),
    supabase
      .from('organization_course_assignments')
      .select('course_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId),
  ])

  if (enrollmentsResult.error) {
    logger.error('Notebook: error resolving enrollments', {
      error: enrollmentsResult.error.message,
    })
  }

  if (assignmentsResult.error) {
    logger.error('Notebook: error resolving assignments', {
      error: assignmentsResult.error.message,
    })
  }

  const enrolledIds = (enrollmentsResult.data || []).map((row) => row.course_id)
  const assignedIds = (assignmentsResult.data || []).map((row) => row.course_id)

  return Array.from(new Set([...enrolledIds, ...assignedIds]))
}

async function fetchCourseModules(
  supabase: SupabaseServerClient,
  courseIds: string[],
): Promise<CourseModuleRow[]> {
  if (courseIds.length === 0) return []

  const { data, error } = await supabase
    .from('course_modules')
    .select('module_id, module_title, course_id')
    .in('course_id', courseIds)

  if (error) {
    logger.error('Notebook: error resolving course modules', { error: error.message })
    return []
  }

  return (data || []) as CourseModuleRow[]
}

async function fetchLessonsForModules(
  supabase: SupabaseServerClient,
  moduleIds: string[],
): Promise<CourseLessonRow[]> {
  if (moduleIds.length === 0) return []

  const { data, error } = await supabase
    .from('course_lessons')
    .select('lesson_id, module_id, lesson_order_index')
    .in('module_id', moduleIds)

  if (error) {
    logger.error('Notebook: error resolving module lessons', { error: error.message })
    return []
  }

  return (data || []) as CourseLessonRow[]
}

async function resolveLessonIdsForCourses(
  supabase: SupabaseServerClient,
  courseIds: string[],
): Promise<string[]> {
  const modules = await fetchCourseModules(supabase, courseIds)
  const moduleIds = modules.map((module) => module.module_id)
  const lessons = await fetchLessonsForModules(supabase, moduleIds)
  return lessons.map((lesson) => lesson.lesson_id)
}

function mapManualNote(row: NoteJoinRow): NotebookManualNote {
  const lesson = row.course_lessons
  const module = lesson?.course_modules
  const course = module?.courses

  return {
    kind: 'manual_note',
    noteId: row.note_id,
    title: row.note_title,
    contentPreview: truncatePreview(row.note_content),
    content: row.note_content,
    tags: normalizeTags(row.note_tags),
    sourceType: row.source_type === 'chat' || row.source_type === 'import' ? row.source_type : 'manual',
    isAutoGenerated: row.is_auto_generated ?? false,
    lessonId: row.lesson_id,
    lessonTitle: lesson?.lesson_title || '',
    moduleTitle: module?.module_title || '',
    courseId: course?.id || module?.course_id || '',
    courseTitle: course?.title || '',
    organizationId: row.organization_id,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || row.created_at || '',
  }
}

async function fetchManualNotes(params: FetchNotesParams): Promise<NotebookManualNote[]> {
  const {
    supabase,
    userId,
    organizationId,
    accessibleCourseIds,
    courseIdFilter,
    cursor,
    limit,
  } = params

  if (accessibleCourseIds.length === 0) return []

  const lessonIdsForFilter = await resolveLessonIdsForCourses(
    supabase,
    courseIdFilter ? [courseIdFilter] : accessibleCourseIds,
  )

  if (lessonIdsForFilter.length === 0) return []

  let query = supabase
    .from('user_lesson_notes')
    .select(
      `
      note_id,
      note_title,
      note_content,
      note_tags,
      is_auto_generated,
      source_type,
      created_at,
      updated_at,
      lesson_id,
      organization_id,
      course_lessons (
        lesson_id,
        lesson_title,
        course_modules (
          module_id,
          module_title,
          course_id,
          courses (
            id,
            title,
            thumbnail_url
          )
        )
      )
    `,
    )
    .eq('user_id', userId)
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .in('lesson_id', lessonIdsForFilter)
    .order('updated_at', { ascending: false })
    .order('note_id', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lte('updated_at', cursor.updatedAt)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Notebook: error fetching manual notes', { error: error.message })
    throw new Error('Error al obtener notas del libro de apuntes.')
  }

  return ((data || []) as unknown as NoteJoinRow[]).map(mapManualNote)
}

async function fetchSofliaSummaries(params: FetchNotesParams): Promise<NotebookSofliaSummary[]> {
  const {
    supabase,
    userId,
    organizationId,
    accessibleCourseIds,
    courseIdFilter,
    cursor,
    limit,
  } = params

  const targetCourseIds = courseIdFilter ? [courseIdFilter] : accessibleCourseIds
  if (targetCourseIds.length === 0) return []

  const summariesClient = createAdminClient()
  let query = summariesClient
    .from('module_learning_summaries')
    .select(
      'summary_id, title, content_html, content_markdown, status, version, module_id, course_id, organization_id, generated_at, created_at, updated_at',
    )
    .eq('user_id', userId)
    .in('course_id', targetCourseIds)
    .in('status', ['ready', 'generating'])
    .order('updated_at', { ascending: false })
    .order('summary_id', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lte('updated_at', cursor.updatedAt)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Notebook: error fetching SofLIA summaries', { error: error.message })
    throw new Error('Error al obtener apuntes SofLIA del libro de apuntes.')
  }

  const rows = (data || []) as SummaryJoinRow[]
  if (rows.length === 0) return []

  const moduleIds = Array.from(new Set(rows.map((row) => row.module_id)))
  const courseIds = Array.from(new Set(rows.map((row) => row.course_id)))

  const [modulesResult, coursesResult] = await Promise.all([
    supabase
      .from('course_modules')
      .select('module_id, module_title')
      .in('module_id', moduleIds),
    supabase
      .from('courses')
      .select('id, title')
      .in('id', courseIds),
  ])

  const moduleMap = new Map(
    (modulesResult.data || []).map((module) => [
      module.module_id,
      module.module_title || '',
    ]),
  )
  const courseMap = new Map(
    (coursesResult.data || []).map((course) => [course.id, course.title || '']),
  )

  return rows.map((row) => {
    // Auto-heal stuck summaries: if status is 'generating' but content already
    // exists, treat it as 'ready' so the UI doesn't show a perpetual spinner.
    const hasContent = Boolean(
      (row.content_html && row.content_html.trim()) ||
      (row.content_markdown && row.content_markdown.trim()),
    )
    const effectiveStatus =
      row.status === 'generating' && hasContent ? 'ready' : (row.status === 'generating' ? 'generating' : 'ready')

    return {
      kind: 'soflia_summary',
      summaryId: row.summary_id,
      title: row.title,
      contentPreview: truncatePreview(row.content_html || row.content_markdown),
      contentHtml: row.content_html,
      contentMarkdown: row.content_markdown,
      status: effectiveStatus,
      version: row.version,
      moduleId: row.module_id,
      moduleTitle: moduleMap.get(row.module_id) || '',
      courseId: row.course_id,
      courseTitle: courseMap.get(row.course_id) || '',
      organizationId: row.organization_id,
      generatedAt: row.generated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  })
}

async function ensureCourseAccess(params: {
  accessibleCourseIds: string[]
  courseId: string
}) {
  return params.accessibleCourseIds.includes(params.courseId)
}

export async function fetchNotebookNotes(
  userId: string,
  organizationId: string,
  queryParams: NotebookNotesQueryParams,
): Promise<NotebookNotesResponse> {
  const supabase = await createClient()
  const limit = clampLimit(queryParams.limit)
  const cursor = decodeNotebookCursor(queryParams.cursor)
  const accessibleCourseIds = await resolveAccessibleCourseIds(supabase, userId, organizationId)

  if (
    queryParams.courseId &&
    !(await ensureCourseAccess({
      accessibleCourseIds,
      courseId: queryParams.courseId,
    }))
  ) {
    return { items: [], nextCursor: null, totalCount: 0 }
  }

  const fetchParams: FetchNotesParams = {
    supabase,
    userId,
    organizationId,
    accessibleCourseIds,
    courseIdFilter: queryParams.courseId,
    cursor,
    limit: limit + 1,
  }

  const [manualNotes, sofliaSummaries] = await Promise.all([
    fetchManualNotes(fetchParams),
    fetchSofliaSummaries(fetchParams),
  ])

  return mergeNotebookSourcesPage(manualNotes, sofliaSummaries, limit, cursor)
}

export async function fetchNotebookCourses(
  userId: string,
  organizationId: string,
): Promise<NotebookCourse[]> {
  const supabase = await createClient()
  const summariesClient = createAdminClient()
  const accessibleCourseIds = await resolveAccessibleCourseIds(supabase, userId, organizationId)

  if (accessibleCourseIds.length === 0) return []

  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, thumbnail_url')
    .in('id', accessibleCourseIds)

  if (coursesError) {
    logger.error('Notebook: error fetching courses', { error: coursesError.message })
    throw new Error('Error al obtener talleres del libro de apuntes.')
  }

  const courses = coursesData || []
  const modules = await fetchCourseModules(supabase, accessibleCourseIds)
  const lessons = await fetchLessonsForModules(
    supabase,
    modules.map((module) => module.module_id),
  )
  const courseIdByModuleId = new Map(
    modules.map((module) => [module.module_id, module.course_id]),
  )
  const courseIdByLessonId = new Map(
    lessons.map((lesson) => [
      lesson.lesson_id,
      courseIdByModuleId.get(lesson.module_id) || '',
    ]),
  )
  const lessonIds = lessons.map((lesson) => lesson.lesson_id)

  const notesCountResult =
    lessonIds.length > 0
      ? await supabase
          .from('user_lesson_notes')
          .select('note_id, lesson_id')
          .eq('user_id', userId)
          .or(`organization_id.eq.${organizationId},organization_id.is.null`)
          .in('lesson_id', lessonIds)
      : { data: [], error: null }

  const summariesCountResult = await summariesClient
    .from('module_learning_summaries')
    .select('summary_id, course_id')
    .eq('user_id', userId)
    .in('course_id', accessibleCourseIds)
    .in('status', ['ready', 'generating'])

  const notesRows = notesCountResult.data || []
  const summariesRows = summariesCountResult.data || []

  return courses
    .map((course) => {
      const notesCount = notesRows.filter(
        (note) => courseIdByLessonId.get(note.lesson_id) === course.id,
      ).length
      const summariesCount = summariesRows.filter(
        (summary) => summary.course_id === course.id,
      ).length

      return {
        courseId: course.id,
        courseTitle: course.title || '',
        courseThumbnail: course.thumbnail_url || null,
        notesCount,
        summariesCount,
      }
    })
    .filter((course) => course.notesCount > 0 || course.summariesCount > 0)
    .sort((left, right) => {
      return (
        right.notesCount +
        right.summariesCount -
        (left.notesCount + left.summariesCount)
      )
    })
}

async function fetchNotebookManualNoteById(params: {
  noteId: string
  organizationId: string
  supabase: SupabaseServerClient
  userId: string
}): Promise<NotebookManualNote | null> {
  const { noteId, organizationId, supabase, userId } = params
  const { data, error } = await supabase
    .from('user_lesson_notes')
    .select(
      `
      note_id,
      note_title,
      note_content,
      note_tags,
      is_auto_generated,
      source_type,
      created_at,
      updated_at,
      lesson_id,
      organization_id,
      course_lessons (
        lesson_id,
        lesson_title,
        course_modules (
          module_id,
          module_title,
          course_id,
          courses (
            id,
            title,
            thumbnail_url
          )
        )
      )
    `,
    )
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .maybeSingle()

  if (error) {
    logger.error('Notebook: error fetching manual note', { error: error.message })
    return null
  }

  return data ? mapManualNote(data as unknown as NoteJoinRow) : null
}

export async function updateNotebookManualNote(
  userId: string,
  organizationId: string,
  noteId: string,
  input: NotebookUpdateNoteInput,
): Promise<NotebookMutationResponse> {
  const supabase = await createClient()
  const normalized = normalizeUpdateInput(input)

  if (!normalized.content) {
    return { success: false, error: 'El contenido de la nota es requerido.' }
  }

  const existingNote = await fetchNotebookManualNoteById({
    noteId,
    organizationId,
    supabase,
    userId,
  })

  if (!existingNote) {
    return { success: false, error: 'Nota no encontrada.' }
  }

  const { error } = await supabase
    .from('user_lesson_notes')
    .update({
      note_content: normalized.content,
      note_tags: normalized.tags,
      note_title: normalized.title || 'Nota de estudio',
      organization_id: organizationId,
      updated_at: new Date().toISOString(),
    })
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)

  if (error) {
    logger.error('Notebook: error updating manual note', {
      error: error.message,
      noteId,
    })
    return { success: false, error: 'Error al actualizar la nota.' }
  }

  const item = await fetchNotebookManualNoteById({
    noteId,
    organizationId,
    supabase,
    userId,
  })

  return item
    ? { success: true, item }
    : { success: false, error: 'No fue posible recargar la nota actualizada.' }
}

export async function duplicateSofliaSummaryAsNote(
  userId: string,
  organizationId: string,
  summaryId: string,
): Promise<NotebookMutationResponse> {
  const supabase = await createClient()
  const summariesClient = createAdminClient()
  const accessibleCourseIds = await resolveAccessibleCourseIds(supabase, userId, organizationId)

  const { data: summary, error: summaryError } = await summariesClient
    .from('module_learning_summaries')
    .select('summary_id, title, content_html, content_markdown, module_id, course_id, user_id, organization_id')
    .eq('summary_id', summaryId)
    .eq('user_id', userId)
    .maybeSingle()

  if (
    summaryError ||
    !summary ||
    !accessibleCourseIds.includes(summary.course_id)
  ) {
    return { success: false, error: 'Apunte SofLIA no encontrado.' }
  }

  const { data: moduleLessons, error: moduleLessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_order_index')
    .eq('module_id', summary.module_id)
    .order('lesson_order_index', { ascending: true })

  if (moduleLessonsError) {
    logger.error('Notebook: error resolving summary lessons', {
      error: moduleLessonsError.message,
      summaryId,
    })
  }

  const lessonIds = (moduleLessons || []).map((lesson) => lesson.lesson_id)
  if (lessonIds.length === 0) {
    return {
      success: false,
      error: 'No hay lecciones disponibles para asociar la nota.',
    }
  }

  const { data: progress } = await supabase
    .from('user_lesson_progress')
    .select('lesson_id, completed_at')
    .eq('user_id', userId)
    .in('lesson_id', lessonIds)
    .eq('is_completed', true)
    .order('completed_at', { ascending: false })
    .limit(1)

  const targetLessonId = progress?.[0]?.lesson_id || lessonIds[0]
  const duplicatedContent = (
    summary.content_markdown?.trim() || getNotebookEditableText(summary.content_html || '')
  ).slice(0, MAX_CONTENT_LENGTH)

  const now = new Date().toISOString()
  const { data: newNote, error: insertError } = await supabase
    .from('user_lesson_notes')
    .insert({
      user_id: userId,
      lesson_id: targetLessonId,
      organization_id: organizationId,
      note_title: `${summary.title} (copia)`,
      note_content: duplicatedContent,
      source_type: 'import',
      is_auto_generated: false,
      note_tags: ['SofLIA', 'duplicado'],
      created_at: now,
      updated_at: now,
    })
    .select('note_id')
    .single()

  if (insertError || !newNote) {
    logger.error('Notebook: error duplicating SofLIA summary', {
      error: insertError?.message,
      summaryId,
    })
    return { success: false, error: 'Error al duplicar el apunte SofLIA.' }
  }

  const item = await fetchNotebookManualNoteById({
    noteId: newNote.note_id,
    organizationId,
    supabase,
    userId,
  })

  return item
    ? { success: true, item }
    : { success: false, error: 'El apunte se duplico, pero no pudo recargarse.' }
}
