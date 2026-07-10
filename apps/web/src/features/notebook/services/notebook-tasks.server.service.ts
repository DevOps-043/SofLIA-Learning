import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'

import type {
  NotebookDerivedTaskListItem,
  NotebookDerivedTaskStatus,
} from '../types'
import {
  decodeNotebookCursor,
  encodeNotebookCursor,
  normalizeNotebookPageSize,
} from './notebook-pagination'

type AdminClient = ReturnType<typeof createAdminClient>

interface TaskListRow {
  task_id: string
  note_id: string
  title: string
  status: string
  created_by: string
  created_at: string
  completed_at: string | null
}

interface NoteContextRow {
  note_id: string
  note_title: string
  lesson_id: string | null
  course_id: string | null
  course_lessons: {
    lesson_title: string
    course_modules: {
      course_id: string
      courses: { id: string; title: string } | null
    } | null
  } | null
  compendium_course: { id: string; title: string } | null
}

interface CourseLessonIdsRow {
  course_lessons: Array<{ lesson_id: string }> | null
}

async function resolveCourseNoteIds(params: {
  client: AdminClient
  courseId: string
  organizationId: string
  userId: string
}): Promise<string[]> {
  const { data: modules, error: moduleError } = await params.client
    .from('course_modules')
    .select('course_lessons(lesson_id)')
    .eq('course_id', params.courseId)

  if (moduleError) {
    throw new Error(`Error al resolver el curso: ${moduleError.message}`)
  }

  const lessonIds = ((modules ?? []) as CourseLessonIdsRow[]).flatMap(
    (module) =>
      (module.course_lessons ?? []).map((lesson) => lesson.lesson_id),
  )

  let noteQuery = fromLoose<Pick<NoteContextRow, 'note_id'>>(
    params.client,
    'user_lesson_notes',
  )
    .select('note_id')
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)

  noteQuery = lessonIds.length
    ? noteQuery.or(
        `course_id.eq.${params.courseId},lesson_id.in.(${lessonIds.join(',')})`,
      )
    : noteQuery.eq('course_id', params.courseId)

  const noteResult = await noteQuery.limit(5000)
  if (noteResult.error) {
    throw new Error(`Error al resolver apuntes del curso: ${noteResult.error.message}`)
  }
  return (noteResult.data ?? []).map((note) => note.note_id)
}

export async function listNotebookDerivedTasks(params: {
  client?: AdminClient
  courseId?: string
  cursor?: string | null
  limit?: number
  organizationId: string
  status?: NotebookDerivedTaskStatus
  userId: string
}): Promise<{
  tasks: NotebookDerivedTaskListItem[]
  nextCursor: string | null
}> {
  const client = params.client ?? createAdminClient()
  const limit = normalizeNotebookPageSize(params.limit)
  const offset = decodeNotebookCursor(params.cursor)

  const courseNoteIds = params.courseId
    ? await resolveCourseNoteIds({
        client,
        courseId: params.courseId,
        organizationId: params.organizationId,
        userId: params.userId,
      })
    : null
  if (courseNoteIds && courseNoteIds.length === 0) {
    return { tasks: [], nextCursor: null }
  }

  let taskQuery = fromLoose<TaskListRow>(client, 'notebook_derived_tasks')
    .select(
      'task_id, note_id, title, status, created_by, created_at, completed_at',
    )
    .eq('user_id', params.userId)
    .eq('organization_id', params.organizationId)

  if (params.status) taskQuery = taskQuery.eq('status', params.status)
  if (courseNoteIds) taskQuery = taskQuery.in('note_id', courseNoteIds)

  const taskResult = await taskQuery
    .order('created_at', { ascending: false })
    .order('task_id', { ascending: false })
    .range(offset, offset + limit)

  if (taskResult.error) {
    throw new Error(`Error al listar tareas: ${taskResult.error.message}`)
  }

  const rows = taskResult.data ?? []
  const pageRows = rows.slice(0, limit)
  const contextByNoteId = new Map<string, NoteContextRow>()
  const noteIds = [...new Set(pageRows.map((task) => task.note_id))]

  if (noteIds.length > 0) {
    const noteResult = await fromLoose<NoteContextRow>(
      client,
      'user_lesson_notes',
    )
      .select(`
        note_id, note_title, lesson_id, course_id,
        course_lessons(
          lesson_title,
          course_modules(
            course_id,
            courses( id, title )
          )
        ),
        compendium_course:courses!user_lesson_notes_course_id_fkey( id, title )
      `)
      .eq('user_id', params.userId)
      .eq('organization_id', params.organizationId)
      .in('note_id', noteIds)

    if (noteResult.error) {
      throw new Error(`Error al cargar contexto de tareas: ${noteResult.error.message}`)
    }
    for (const context of noteResult.data ?? []) {
      contextByNoteId.set(context.note_id, context)
    }
  }

  const tasks = pageRows.flatMap((row): NotebookDerivedTaskListItem[] => {
    const context = contextByNoteId.get(row.note_id)
    if (!context) return []
    const course =
      context.course_lessons?.course_modules?.courses ?? context.compendium_course
    const courseId =
      context.course_lessons?.course_modules?.course_id ??
      context.course_id ??
      course?.id
    if (!course || !courseId) return []

    return [
      {
        taskId: row.task_id,
        noteId: row.note_id,
        title: row.title,
        status: row.status as NotebookDerivedTaskStatus,
        createdBy: row.created_by === 'user' ? 'user' : 'ai',
        createdAt: row.created_at,
        completedAt: row.completed_at,
        noteTitle: context.note_title,
        courseId,
        courseTitle: course.title,
        lessonId: context.lesson_id,
        lessonTitle: context.course_lessons?.lesson_title ?? null,
      },
    ]
  })

  return {
    tasks,
    nextCursor:
      rows.length > limit ? encodeNotebookCursor(offset + limit) : null,
  }
}

