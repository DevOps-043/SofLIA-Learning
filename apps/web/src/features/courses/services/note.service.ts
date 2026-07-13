import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import type { Json, Tables, TablesUpdate } from '../../../lib/supabase/types'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>
type LessonNoteRow = Tables<'user_lesson_notes'>
type LessonNoteRowLike = Omit<
  LessonNoteRow,
  'course_id' | 'enrollment_id' | 'organization_id' | 'is_user_edited'
> & {
  course_id?: string | null
  enrollment_id?: string | null
  organization_id?: string | null
}

const NOTE_SELECT_COLUMNS =
  'note_id, note_title, note_content, note_tags, is_auto_generated, source_type, created_at, updated_at, user_id, lesson_id, enrollment_id, organization_id'

export interface LessonNote {
  note_id: string
  note_title: string
  note_content: string
  note_tags?: string[]
  is_auto_generated?: boolean
  source_type?: LessonNoteSource
  created_at: string
  updated_at: string
  user_id: string
  lesson_id: string
  enrollment_id?: string | null
  organization_id?: string | null
}

export interface CreateNoteInput {
  enrollment_id?: string | null
  is_auto_generated?: boolean
  note_title: string
  note_content: string
  note_tags?: string[]
  organization_id?: string | null
  source_type?: LessonNoteSource
}

export interface UpdateNoteInput {
  note_title?: string
  note_content?: string
  note_tags?: string[]
}

export interface NoteMutationScope {
  enrollmentId: string
  lessonId: string
  organizationId: string | null
}

export class NoteMutationError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'READ_ONLY',
    message: string,
  ) {
    super(message)
    this.name = 'NoteMutationError'
  }
}

export interface CourseNotesStats {
  totalNotes: number
  lessonsWithNotes: number
  totalLessons: number
  lastUpdate: string | null
}

interface CourseNotesStatsRpcRow {
  total_notes: number | string | null
  lessons_with_notes: number | string | null
  total_lessons: number | string | null
  last_update: string | null
}

export type LessonNoteSource =
  | 'manual'
  | 'chat'
  | 'import'
  | 'lesson_auto_note'
  | 'course_compendium'

function parseNoteTags(value: Json): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((tag): tag is string => typeof tag === 'string')
}

function parseNoteSource(value: string | null): LessonNote['source_type'] {
  return value === 'chat' ||
    value === 'import' ||
    value === 'manual' ||
    value === 'lesson_auto_note' ||
    value === 'course_compendium'
    ? value
    : 'manual'
}

function mapLessonNote(row: LessonNoteRowLike): LessonNote {
  return {
    note_id: row.note_id,
    note_title: row.note_title,
    note_content: row.note_content,
    note_tags: parseNoteTags(row.note_tags),
    is_auto_generated: row.is_auto_generated ?? false,
    source_type: parseNoteSource(row.source_type),
    created_at: row.created_at ?? '',
    updated_at: row.updated_at ?? '',
    user_id: row.user_id,
    // Course compendium rows are the only ones with a null lesson_id and they
    // never flow through NoteService (all queries here filter by lesson).
    lesson_id: row.lesson_id ?? '',
    enrollment_id: row.enrollment_id ?? null,
    organization_id: row.organization_id ?? null,
  }
}

function toCount(value: number | string | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function mapCourseNotesStats(row: CourseNotesStatsRpcRow): CourseNotesStats {
  return {
    totalNotes: toCount(row.total_notes),
    lessonsWithNotes: toCount(row.lessons_with_notes),
    totalLessons: toCount(row.total_lessons),
    lastUpdate: row.last_update || null,
  }
}

export class NoteService {
  private static async getCourseLessonIds(
    supabase: SupabaseServerClient,
    courseId: string,
  ): Promise<string[]> {
    // Single round-trip: modules + nested lesson ids (was 2 sequential queries).
    const { data: modules, error } = await supabase
      .from('course_modules')
      .select('course_lessons(lesson_id)')
      .eq('course_id', courseId)

    if (error) {
      throw new Error(`Error al obtener lecciones del curso: ${error.message}`)
    }

    return (modules ?? []).flatMap((module) =>
      (module.course_lessons ?? []).map((lesson) => lesson.lesson_id),
    )
  }

  /**
   * Obtiene todas las notas de un usuario para una lección específica.
   */
  static async getNotesByLesson(
    userId: string,
    lessonId: string,
    enrollmentId?: string | null,
  ): Promise<LessonNote[]> {
    try {
      const supabase = createAdminClient()

      let query = supabase
        .from('user_lesson_notes')
        .select(NOTE_SELECT_COLUMNS)
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)

      if (enrollmentId !== undefined) {
        query = enrollmentId
          ? query.eq('enrollment_id', enrollmentId)
          : query.is('enrollment_id', null)
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        throw new Error(`Error al obtener notas: ${error.message}`)
      }

      return (data || []).map(mapLessonNote)
    } catch (error) {
      throw error
    }
  }

  /**
   * Obtiene todas las notas de un usuario para un curso.
   */
  static async getNotesByCourse(
    userId: string,
    courseId: string,
    enrollmentId?: string | null,
  ): Promise<LessonNote[]> {
    const supabase = createAdminClient()
    return this.getNotesByCourseWithClient(supabase, userId, courseId, enrollmentId)
  }

  static async getNotesByCourseWithClient(
    supabase: SupabaseServerClient,
    userId: string,
    courseId: string,
    enrollmentId?: string | null,
  ): Promise<LessonNote[]> {
    try {
      const lessonIds = await this.getCourseLessonIds(supabase, courseId)

      if (lessonIds.length === 0) {
        return []
      }

      let query = supabase
        .from('user_lesson_notes')
        .select(NOTE_SELECT_COLUMNS)
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)

      if (enrollmentId !== undefined) {
        query = enrollmentId
          ? query.eq('enrollment_id', enrollmentId)
          : query.is('enrollment_id', null)
      }

      const { data, error } = await query
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) {
        throw new Error(`Error al obtener notas: ${error.message}`)
      }

      return (data || []).map(mapLessonNote)
    } catch (error) {
      throw error
    }
  }

  /**
   * Crea una nueva nota.
   */
  static async createNote(
    userId: string,
    lessonId: string,
    noteData: CreateNoteInput,
  ): Promise<LessonNote> {
    try {
      const supabase = createAdminClient()

      const { data, error } = await supabase
        .from('user_lesson_notes')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
          enrollment_id: noteData.enrollment_id || null,
          organization_id: noteData.organization_id || null,
          note_title: noteData.note_title,
          note_content: noteData.note_content,
          note_tags: noteData.note_tags || [],
          source_type: noteData.source_type || 'manual',
          is_auto_generated: noteData.is_auto_generated ?? false,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Error al crear nota: ${error.message}`)
      }

      return mapLessonNote(data)
    } catch (error) {
      throw error
    }
  }

  /**
   * Actualiza una nota existente.
   */
  static async updateNote(
    userId: string,
    noteId: string,
    noteData: UpdateNoteInput,
    scope: NoteMutationScope,
  ): Promise<LessonNote> {
    try {
      const supabase = createAdminClient()

      let ownershipQuery = supabase
        .from('user_lesson_notes')
        .select('note_id, source_type, is_auto_generated')
        .eq('note_id', noteId)
        .eq('user_id', userId)
        .eq('lesson_id', scope.lessonId)
        .eq('enrollment_id', scope.enrollmentId)

      ownershipQuery = scope.organizationId
        ? ownershipQuery.eq('organization_id', scope.organizationId)
        : ownershipQuery.is('organization_id', null)

      const { data: existing, error: ownershipError } =
        await ownershipQuery.maybeSingle()

      if (ownershipError) {
        throw new Error(`Error al validar la nota: ${ownershipError.message}`)
      }
      if (!existing) {
        throw new NoteMutationError('NOT_FOUND', 'Nota no encontrada.')
      }
      if (
        existing.is_auto_generated ||
        existing.source_type === 'lesson_auto_note' ||
        existing.source_type === 'course_compendium'
      ) {
        throw new NoteMutationError(
          'READ_ONLY',
          'Los apuntes generados por SofLIA son de solo lectura.',
        )
      }

      const updateData: TablesUpdate<'user_lesson_notes'> = {
        updated_at: new Date().toISOString(),
      }

      if (noteData.note_title !== undefined) {
        updateData.note_title = noteData.note_title
      }
      if (noteData.note_content !== undefined) {
        updateData.note_content = noteData.note_content
      }
      if (noteData.note_tags !== undefined) {
        updateData.note_tags = noteData.note_tags
      }

      let query = supabase
        .from('user_lesson_notes')
        .update(updateData)
        .eq('note_id', noteId)
        .eq('user_id', userId)
        .eq('lesson_id', scope.lessonId)
        .eq('enrollment_id', scope.enrollmentId)

      query = scope.organizationId
        ? query.eq('organization_id', scope.organizationId)
        : query.is('organization_id', null)

      const { data, error } = await query
        .select()
        .maybeSingle()

      if (error) {
        throw new Error(`Error al actualizar nota: ${error.message}`)
      }
      if (!data) {
        throw new NoteMutationError('NOT_FOUND', 'Nota no encontrada.')
      }

      return mapLessonNote(data)
    } catch (error) {
      throw error
    }
  }

  /**
   * Elimina una nota.
   */
  static async deleteNote(
    userId: string,
    noteId: string,
    scope: NoteMutationScope,
  ): Promise<void> {
    try {
      const supabase = createAdminClient()

      let ownershipQuery = supabase
        .from('user_lesson_notes')
        .select('note_id, source_type, is_auto_generated')
        .eq('note_id', noteId)
        .eq('user_id', userId)
        .eq('lesson_id', scope.lessonId)
        .eq('enrollment_id', scope.enrollmentId)

      ownershipQuery = scope.organizationId
        ? ownershipQuery.eq('organization_id', scope.organizationId)
        : ownershipQuery.is('organization_id', null)

      const { data: existing, error: ownershipError } =
        await ownershipQuery.maybeSingle()

      if (ownershipError) {
        throw new Error(`Error al validar la nota: ${ownershipError.message}`)
      }
      if (!existing) {
        throw new NoteMutationError('NOT_FOUND', 'Nota no encontrada.')
      }
      if (
        existing.is_auto_generated ||
        existing.source_type === 'lesson_auto_note' ||
        existing.source_type === 'course_compendium'
      ) {
        throw new NoteMutationError(
          'READ_ONLY',
          'Los apuntes generados por SofLIA son de solo lectura.',
        )
      }

      let query = supabase
        .from('user_lesson_notes')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', userId)
        .eq('lesson_id', scope.lessonId)
        .eq('enrollment_id', scope.enrollmentId)

      query = scope.organizationId
        ? query.eq('organization_id', scope.organizationId)
        : query.is('organization_id', null)

      const { data, error } = await query.select('note_id').maybeSingle()

      if (error) {
        throw new Error(`Error al eliminar nota: ${error.message}`)
      }
      if (!data) {
        throw new NoteMutationError('NOT_FOUND', 'Nota no encontrada.')
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Obtiene estadísticas de notas para un curso.
   */
  static async getNotesStats(
    userId: string,
    courseId: string,
    enrollmentId?: string | null,
  ): Promise<CourseNotesStats> {
    const supabase = createAdminClient()
    return this.getNotesStatsWithClient(supabase, userId, courseId, enrollmentId)
  }

  static async getNotesStatsWithClient(
    supabase: SupabaseServerClient,
    userId: string,
    courseId: string,
    enrollmentId?: string | null,
  ): Promise<CourseNotesStats> {
    try {
      // Single round-trip: aggregation happens in Postgres. v1 keeps the
      // legacy "all enrollments" semantics (enrollmentId undefined); v2 scopes
      // by enrollment (uuid) or personal notes (null).
      const { data: rpcData, error: rpcError } =
        enrollmentId === undefined
          ? await supabase.rpc('get_course_notes_stats', {
              p_user_id: userId,
              p_course_id: courseId,
            })
          : await supabase.rpc('get_course_notes_stats_v2', {
              p_user_id: userId,
              p_course_id: courseId,
              p_enrollment_id: enrollmentId,
            })

      if (!rpcError && rpcData) {
        const row = (Array.isArray(rpcData) ? rpcData[0] : rpcData) as
          | CourseNotesStatsRpcRow
          | undefined
        if (row) {
          return mapCourseNotesStats(row)
        }
      }

      // Resilience fallback only (RPC missing/failed) — 4 round-trips.
      const lessonIds = await this.getCourseLessonIds(supabase, courseId)
      const totalLessons = lessonIds.length

      if (lessonIds.length === 0) {
        return {
          totalNotes: 0,
          lessonsWithNotes: 0,
          totalLessons,
          lastUpdate: null,
        }
      }

      const [countResult, latestResult] = await Promise.all([
        (() => {
          let query = supabase
            .from('user_lesson_notes')
            .select('lesson_id')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds)

          if (enrollmentId !== undefined) {
            query = enrollmentId
              ? query.eq('enrollment_id', enrollmentId)
              : query.is('enrollment_id', null)
          }

          return query.limit(5000)
        })(),
        (() => {
          let query = supabase
            .from('user_lesson_notes')
            .select('updated_at')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds)

          if (enrollmentId !== undefined) {
            query = enrollmentId
              ? query.eq('enrollment_id', enrollmentId)
              : query.is('enrollment_id', null)
          }

          return query
            .order('updated_at', { ascending: false })
            .limit(1)
        })(),
      ])

      const noteRows = countResult.data || []
      const uniqueLessonIds = new Set(
        noteRows.map((noteRow) => noteRow.lesson_id),
      )
      const lastUpdate = latestResult.data?.[0]?.updated_at || null

      return {
        totalNotes: noteRows.length,
        lessonsWithNotes: uniqueLessonIds.size,
        totalLessons,
        lastUpdate,
      }
    } catch (error) {
      throw error
    }
  }
}
