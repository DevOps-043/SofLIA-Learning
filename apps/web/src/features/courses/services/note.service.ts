import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import type { Json, Tables, TablesUpdate } from '../../../lib/supabase/types'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createClient>>
  | ReturnType<typeof createAdminClient>
type LessonNoteRow = Tables<'user_lesson_notes'>
type LessonNoteRowLike = Omit<LessonNoteRow, 'enrollment_id' | 'organization_id'> & {
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
  source_type?: 'manual' | 'chat' | 'import'
  created_at: string
  updated_at: string
  user_id: string
  lesson_id: string
  enrollment_id?: string | null
  organization_id?: string | null
}

export interface CreateNoteInput {
  enrollment_id?: string | null
  note_title: string
  note_content: string
  note_tags?: string[]
  organization_id?: string | null
  source_type?: 'manual' | 'chat' | 'import'
}

export interface UpdateNoteInput {
  note_title?: string
  note_content?: string
  note_tags?: string[]
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

interface CourseNotesStatsRpcClient {
  rpc(
    fn: 'get_course_notes_stats',
    args: { p_user_id: string; p_course_id: string },
  ): PromiseLike<{
    data: CourseNotesStatsRpcRow[] | CourseNotesStatsRpcRow | null
    error: { message?: string } | null
  }>
}

function parseNoteTags(value: Json): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((tag): tag is string => typeof tag === 'string')
}

function parseNoteSource(value: string | null): LessonNote['source_type'] {
  return value === 'chat' || value === 'import' || value === 'manual'
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
    lesson_id: row.lesson_id,
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
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select('module_id')
      .eq('course_id', courseId)

    if (modulesError) {
      throw new Error(`Error al obtener módulos: ${modulesError.message}`)
    }

    const moduleIds = modules?.map((module) => module.module_id) || []

    if (moduleIds.length === 0) {
      return []
    }

    const { data: lessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('lesson_id')
      .in('module_id', moduleIds)

    if (lessonsError) {
      throw new Error(`Error al obtener lecciones: ${lessonsError.message}`)
    }

    return lessons?.map((lesson) => lesson.lesson_id) || []
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
          is_auto_generated: false,
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
    enrollmentId?: string | null,
  ): Promise<LessonNote> {
    try {
      const supabase = createAdminClient()

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

      if (enrollmentId !== undefined) {
        query = enrollmentId
          ? query.eq('enrollment_id', enrollmentId)
          : query.is('enrollment_id', null)
      }

      const { data, error } = await query
        .select()
        .single()

      if (error) {
        throw new Error(`Error al actualizar nota: ${error.message}`)
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
    enrollmentId?: string | null,
  ): Promise<void> {
    try {
      const supabase = createAdminClient()

      let query = supabase
        .from('user_lesson_notes')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', userId)

      if (enrollmentId !== undefined) {
        query = enrollmentId
          ? query.eq('enrollment_id', enrollmentId)
          : query.is('enrollment_id', null)
      }

      const { error } = await query

      if (error) {
        throw new Error(`Error al eliminar nota: ${error.message}`)
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
      if (enrollmentId === undefined) {
        const { data: rpcData, error: rpcError } = await (
          supabase as unknown as CourseNotesStatsRpcClient
        ).rpc('get_course_notes_stats', {
          p_user_id: userId,
          p_course_id: courseId,
        })

        if (!rpcError && rpcData) {
          const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
          if (row) {
            return mapCourseNotesStats(row)
          }
        }
      }

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
