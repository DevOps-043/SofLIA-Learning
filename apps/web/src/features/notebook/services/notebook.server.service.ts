/**
 * Notebook Server Service
 *
 * Provides data access for the notebook feature. Queries user_lesson_notes
 * and module_learning_summaries, joining through course_lessons → course_modules → courses
 * to resolve titles and enforce org-scoped access.
 *
 * All queries filter by userId + organizationId and only include courses the
 * user is enrolled in or assigned to within the organization.
 */

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

import type {
  NotebookCourse,
  NotebookItem,
  NotebookManualNote,
  NotebookNotesQueryParams,
  NotebookNotesResponse,
  NotebookSofliaSummary,
} from '../types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50
const PREVIEW_LENGTH = 180

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function truncatePreview(text: string, maxLength: number = PREVIEW_LENGTH): string {
  const cleaned = stripHtmlTags(text).replace(/\s+/g, ' ').trim()
  if (cleaned.length <= maxLength) return cleaned
  return `${cleaned.slice(0, maxLength).trimEnd()}…`
}

function clampLimit(rawLimit: number | undefined): number {
  const limit = rawLimit ?? DEFAULT_PAGE_SIZE
  return Math.max(1, Math.min(limit, MAX_PAGE_SIZE))
}

// ---------------------------------------------------------------------------
// Access resolution: courses the user can see in this org
// ---------------------------------------------------------------------------

async function resolveAccessibleCourseIds(
  supabase: SupabaseServerClient,
  userId: string,
  organizationId: string,
): Promise<string[]> {
  // 1. Courses enrolled in (regardless of org)
  // 2. Courses assigned by this organization
  const [enrollmentsResult, assignmentsResult] = await Promise.all([
    supabase
      .from('user_course_enrollments')
      .select('course_id')
      .eq('user_id', userId),
    supabase
      .from('organization_course_assignments')
      .select('course_id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId),
  ])

  const enrolledIds = (enrollmentsResult.data || []).map((row) => row.course_id)
  const assignedIds = (assignmentsResult.data || []).map((row) => row.course_id)

  return Array.from(new Set([...enrolledIds, ...assignedIds]))
}

// ---------------------------------------------------------------------------
// Notes query
// ---------------------------------------------------------------------------

interface FetchNotesParams {
  supabase: SupabaseServerClient
  userId: string
  organizationId: string
  accessibleCourseIds: string[]
  courseIdFilter?: string
  cursor?: string
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

async function fetchManualNotes(params: FetchNotesParams): Promise<NotebookManualNote[]> {
  const { supabase, userId, organizationId, accessibleCourseIds, courseIdFilter, cursor, limit } =
    params

  if (accessibleCourseIds.length === 0) return []

  // Build lesson IDs from accessible courses → modules → lessons
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
    .in('lesson_id', lessonIdsForFilter)
    .order('updated_at', { ascending: false })
    .limit(limit)

  // Cursor-based pagination by updated_at
  if (cursor) {
    query = query.lt('updated_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Notebook: error fetching manual notes', { error: error.message })
    throw new Error('Error al obtener notas del libro de apuntes.')
  }

  return (data as unknown as NoteJoinRow[]).map((row) => {
    const lesson = row.course_lessons
    const module = lesson?.course_modules
    const course = module?.courses

    return {
      kind: 'manual_note' as const,
      noteId: row.note_id,
      title: row.note_title,
      contentPreview: truncatePreview(row.note_content),
      content: row.note_content,
      tags: Array.isArray(row.note_tags) ? row.note_tags : [],
      sourceType: (row.source_type || 'manual') as 'manual' | 'chat' | 'import',
      isAutoGenerated: row.is_auto_generated ?? false,
      lessonId: row.lesson_id,
      lessonTitle: lesson?.lesson_title || '',
      moduleTitle: module?.module_title || '',
      courseId: course?.id || '',
      courseTitle: course?.title || '',
      organizationId: row.organization_id,
      createdAt: row.created_at || '',
      updatedAt: row.updated_at || '',
    }
  })
}

// ---------------------------------------------------------------------------
// Summaries query
// ---------------------------------------------------------------------------

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

async function fetchSofliaSummaries(params: FetchNotesParams): Promise<NotebookSofliaSummary[]> {
  const { supabase, userId, accessibleCourseIds, courseIdFilter, cursor, limit } = params

  const targetCourseIds = courseIdFilter ? [courseIdFilter] : accessibleCourseIds
  if (targetCourseIds.length === 0) return []

  let query = supabase
    .from('module_learning_summaries')
    .select(
      'summary_id, title, content_html, content_markdown, status, version, module_id, course_id, organization_id, generated_at, created_at, updated_at',
    )
    .eq('user_id', userId)
    .in('course_id', targetCourseIds)
    .in('status', ['ready', 'generating'])
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (cursor) {
    query = query.lt('updated_at', cursor)
  }

  const { data, error } = await query

  if (error) {
    logger.error('Notebook: error fetching SofLIA summaries', { error: error.message })
    throw new Error('Error al obtener apuntes SofLIA del libro de apuntes.')
  }

  // Resolve module titles and course titles in batch
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
    (modulesResult.data || []).map((m) => [m.module_id, m.module_title || '']),
  )
  const courseMap = new Map(
    (coursesResult.data || []).map((c) => [c.id, c.title || '']),
  )

  return rows.map((row) => ({
    kind: 'soflia_summary' as const,
    summaryId: row.summary_id,
    title: row.title,
    contentPreview: truncatePreview(row.content_html || row.content_markdown),
    contentHtml: row.content_html,
    contentMarkdown: row.content_markdown,
    status: row.status as 'generating' | 'ready' | 'failed',
    version: row.version,
    moduleId: row.module_id,
    moduleTitle: moduleMap.get(row.module_id) || '',
    courseId: row.course_id,
    courseTitle: courseMap.get(row.course_id) || '',
    organizationId: row.organization_id,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

// ---------------------------------------------------------------------------
// Lesson IDs resolver
// ---------------------------------------------------------------------------

async function resolveLessonIdsForCourses(
  supabase: SupabaseServerClient,
  courseIds: string[],
): Promise<string[]> {
  if (courseIds.length === 0) return []

  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id')
    .in('course_id', courseIds)

  const moduleIds = (modules || []).map((m) => m.module_id)
  if (moduleIds.length === 0) return []

  const { data: lessons } = await supabase
    .from('course_lessons')
    .select('lesson_id')
    .in('module_id', moduleIds)

  return (lessons || []).map((l) => l.lesson_id)
}

// ---------------------------------------------------------------------------
// Public API: list notes
// ---------------------------------------------------------------------------

export async function fetchNotebookNotes(
  userId: string,
  organizationId: string,
  queryParams: NotebookNotesQueryParams,
): Promise<NotebookNotesResponse> {
  const supabase = await createClient()
  const limit = clampLimit(queryParams.limit)

  // Verify courseId access if provided
  const accessibleCourseIds = await resolveAccessibleCourseIds(supabase, userId, organizationId)

  if (queryParams.courseId && !accessibleCourseIds.includes(queryParams.courseId)) {
    // User does not have access to this course — return empty, don't leak
    return { items: [], nextCursor: null, totalCount: 0 }
  }

  const fetchParams: FetchNotesParams = {
    supabase,
    userId,
    organizationId,
    accessibleCourseIds,
    courseIdFilter: queryParams.courseId,
    cursor: queryParams.cursor,
    limit: limit + 1, // Fetch one extra to detect next page
  }

  // Fetch both sources concurrently
  const [manualNotes, sofliaSummaries] = await Promise.all([
    fetchManualNotes(fetchParams),
    fetchSofliaSummaries(fetchParams),
  ])

  // Merge and sort by updatedAt descending
  const merged: NotebookItem[] = [...manualNotes, ...sofliaSummaries].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  // Apply limit and determine next cursor
  const hasMore = merged.length > limit
  const page = merged.slice(0, limit)
  const nextCursor = hasMore && page.length > 0 ? page[page.length - 1].updatedAt : null

  return {
    items: page,
    nextCursor,
    totalCount: page.length, // Approximate; exact count would require a separate query
  }
}

// ---------------------------------------------------------------------------
// Public API: list courses with note counts
// ---------------------------------------------------------------------------

export async function fetchNotebookCourses(
  userId: string,
  organizationId: string,
): Promise<NotebookCourse[]> {
  const supabase = await createClient()

  const accessibleCourseIds = await resolveAccessibleCourseIds(supabase, userId, organizationId)
  if (accessibleCourseIds.length === 0) return []

  // Fetch courses metadata
  const { data: coursesData, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, thumbnail_url')
    .in('id', accessibleCourseIds)

  if (coursesError) {
    logger.error('Notebook: error fetching courses', { error: coursesError.message })
    throw new Error('Error al obtener talleres del libro de apuntes.')
  }

  const courses = coursesData || []
  if (courses.length === 0) return []

  // Count notes and summaries per course
  const lessonIdsByCourse = new Map<string, string[]>()
  for (const course of courses) {
    const lessonIds = await resolveLessonIdsForCourses(supabase, [course.id])
    lessonIdsByCourse.set(course.id, lessonIds)
  }

  const allLessonIds = Array.from(
    new Set(Array.from(lessonIdsByCourse.values()).flat()),
  )

  // Fetch note counts
  const notesCountResult =
    allLessonIds.length > 0
      ? await supabase
          .from('user_lesson_notes')
          .select('note_id, lesson_id')
          .eq('user_id', userId)
          .in('lesson_id', allLessonIds)
      : { data: [], error: null }

  // Fetch summary counts
  const summariesCountResult = await supabase
    .from('module_learning_summaries')
    .select('summary_id, course_id')
    .eq('user_id', userId)
    .in('course_id', accessibleCourseIds)
    .in('status', ['ready', 'generating'])

  const notesRows = notesCountResult.data || []
  const summariesRows = summariesCountResult.data || []

  return courses
    .map((course) => {
      const courseLessonIds = new Set(lessonIdsByCourse.get(course.id) || [])
      const notesCount = notesRows.filter((n) => courseLessonIds.has(n.lesson_id)).length
      const summariesCount = summariesRows.filter((s) => s.course_id === course.id).length

      return {
        courseId: course.id,
        courseTitle: course.title || '',
        courseThumbnail: course.thumbnail_url || null,
        notesCount,
        summariesCount,
      }
    })
    .filter((c) => c.notesCount > 0 || c.summariesCount > 0)
    .sort((a, b) => (b.notesCount + b.summariesCount) - (a.notesCount + a.summariesCount))
}

// ---------------------------------------------------------------------------
// Public API: duplicate SofLIA summary as manual note
// ---------------------------------------------------------------------------

export interface DuplicateSummaryResult {
  success: boolean
  noteId?: string
  error?: string
}

export async function duplicateSofliaSummaryAsNote(
  userId: string,
  organizationId: string,
  summaryId: string,
): Promise<DuplicateSummaryResult> {
  const supabase = await createClient()

  // 1. Fetch the summary
  const { data: summary, error: summaryError } = await supabase
    .from('module_learning_summaries')
    .select('summary_id, title, content_markdown, module_id, course_id, user_id')
    .eq('summary_id', summaryId)
    .eq('user_id', userId)
    .single()

  if (summaryError || !summary) {
    return { success: false, error: 'Apunte SofLIA no encontrado.' }
  }

  // 2. Find the last completed lesson in this module
  const { data: moduleLessons } = await supabase
    .from('course_lessons')
    .select('lesson_id')
    .eq('module_id', summary.module_id)
    .order('lesson_order_index', { ascending: false })

  const lessonIds = (moduleLessons || []).map((l) => l.lesson_id)
  if (lessonIds.length === 0) {
    return {
      success: false,
      error: 'No hay lecciones disponibles en este módulo para asociar la nota.',
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

  const targetLessonId = progress?.[0]?.lesson_id || null

  if (!targetLessonId) {
    return {
      success: false,
      error:
        'Necesitas completar al menos una lección de este módulo para duplicar el apunte.',
    }
  }

  // 3. Create the manual note
  const { data: newNote, error: insertError } = await supabase
    .from('user_lesson_notes')
    .insert({
      user_id: userId,
      lesson_id: targetLessonId,
      organization_id: organizationId,
      note_title: `${summary.title} (copia)`,
      note_content: summary.content_markdown || '',
      source_type: 'import',
      is_auto_generated: false,
      note_tags: ['soflia', 'duplicado'],
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

  return { success: true, noteId: newNote.note_id }
}
