import { createClient } from '../../../lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

const NOTE_SELECT_COLUMNS =
  'note_id, note_title, note_content, note_tags, is_auto_generated, source_type, created_at, updated_at, user_id, lesson_id'

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
}

export interface CreateNoteInput {
  note_title: string
  note_content: string
  note_tags?: string[]
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
  ): Promise<LessonNote[]> {
    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('user_lesson_notes')
        .select(NOTE_SELECT_COLUMNS)
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(200)

      if (error) {
        throw new Error(`Error al obtener notas: ${error.message}`)
      }

      return data || []
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
  ): Promise<LessonNote[]> {
    const supabase = await createClient()
    return this.getNotesByCourseWithClient(supabase, userId, courseId)
  }

  static async getNotesByCourseWithClient(
    supabase: SupabaseServerClient,
    userId: string,
    courseId: string,
  ): Promise<LessonNote[]> {
    try {
      const lessonIds = await this.getCourseLessonIds(supabase, courseId)

      if (lessonIds.length === 0) {
        return []
      }

      const { data, error } = await supabase
        .from('user_lesson_notes')
        .select(NOTE_SELECT_COLUMNS)
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500)

      if (error) {
        throw new Error(`Error al obtener notas: ${error.message}`)
      }

      return data || []
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
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('user_lesson_notes')
        .insert({
          user_id: userId,
          lesson_id: lessonId,
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

      return data
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
  ): Promise<LessonNote> {
    try {
      const supabase = await createClient()

      const updateData: Record<string, unknown> = {
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

      const { data, error } = await supabase
        .from('user_lesson_notes')
        .update(updateData)
        .eq('note_id', noteId)
        .eq('user_id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Error al actualizar nota: ${error.message}`)
      }

      return data
    } catch (error) {
      throw error
    }
  }

  /**
   * Elimina una nota.
   */
  static async deleteNote(userId: string, noteId: string): Promise<void> {
    try {
      const supabase = await createClient()

      const { error } = await supabase
        .from('user_lesson_notes')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', userId)

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
  ): Promise<CourseNotesStats> {
    const supabase = await createClient()
    return this.getNotesStatsWithClient(supabase, userId, courseId)
  }

  static async getNotesStatsWithClient(
    supabase: SupabaseServerClient,
    userId: string,
    courseId: string,
  ): Promise<CourseNotesStats> {
    try {
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
        supabase
          .from('user_lesson_notes')
          .select('lesson_id')
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
          .limit(5000),
        supabase
          .from('user_lesson_notes')
          .select('updated_at')
          .eq('user_id', userId)
          .in('lesson_id', lessonIds)
          .order('updated_at', { ascending: false })
          .limit(1),
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
