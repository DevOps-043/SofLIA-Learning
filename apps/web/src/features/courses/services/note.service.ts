import { createClient } from '../../../lib/supabase/server'

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

export class NoteService {
  /**
   * Obtiene todas las notas de un usuario para una lección específica
   */
  static async getNotesByLesson(userId: string, lessonId: string): Promise<LessonNote[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('user_lesson_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('lesson_id', lessonId)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Error al obtener notas: ${error.message}`)
      }

      return data || []
    } catch (error) {
      throw error
    }
  }

  /**
   * Obtiene todas las notas de un usuario para un curso (todas las lecciones)
   */
  static async getNotesByCourse(userId: string, courseId: string): Promise<LessonNote[]> {
    try {
      const supabase = await createClient()
      
      // Primero obtener todas las lecciones del curso
      const { data: modules, error: modulesError } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', courseId)

      if (modulesError) {
        throw new Error(`Error al obtener módulos: ${modulesError.message}`)
      }

      const moduleIds = modules?.map(m => m.module_id) || []

      if (moduleIds.length === 0) {
        return []
      }

      // Obtener todas las lecciones de esos módulos
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('lesson_id')
        .in('module_id', moduleIds)

      if (lessonsError) {
        throw new Error(`Error al obtener lecciones: ${lessonsError.message}`)
      }

      const lessonIds = lessons?.map(l => l.lesson_id) || []

      if (lessonIds.length === 0) {
        return []
      }

      // Obtener todas las notas de esas lecciones
      const { data, error } = await supabase
        .from('user_lesson_notes')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds)
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Error al obtener notas: ${error.message}`)
      }

      return data || []
    } catch (error) {
      throw error
    }
  }

  /**
   * Crea una nueva nota
   */
  static async createNote(
    userId: string,
    lessonId: string,
    noteData: CreateNoteInput
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
          is_auto_generated: false
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
   * Actualiza una nota existente
   */
  static async updateNote(
    userId: string,
    noteId: string,
    noteData: UpdateNoteInput
  ): Promise<LessonNote> {
    try {
      const supabase = await createClient()
      
      const updateData: any = {
        updated_at: new Date().toISOString()
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
        .eq('user_id', userId) // Asegurar que solo el dueño puede actualizar
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
   * Elimina una nota
   */
  static async deleteNote(userId: string, noteId: string): Promise<void> {
    try {
      const supabase = await createClient()
      
      const { error } = await supabase
        .from('user_lesson_notes')
        .delete()
        .eq('note_id', noteId)
        .eq('user_id', userId) // Asegurar que solo el dueño puede eliminar

      if (error) {
        throw new Error(`Error al eliminar nota: ${error.message}`)
      }
    } catch (error) {
      throw error
    }
  }

  /**
   * Obtiene estadísticas de notas para un curso
   */
  static async getNotesStats(userId: string, courseId: string): Promise<{
    totalNotes: number
    lessonsWithNotes: number
    totalLessons: number
    lastUpdate: string | null
  }> {
    try {
      const notes = await this.getNotesByCourse(userId, courseId)
      
      // Obtener total de lecciones del curso
      const supabase = await createClient()
      const { data: modules } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', courseId)

      const moduleIds = modules?.map(m => m.module_id) || []
      
      let totalLessons = 0
      if (moduleIds.length > 0) {
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('lesson_id')
          .in('module_id', moduleIds)
        
        totalLessons = lessons?.length || 0
      }

      const uniqueLessonIds = new Set(notes.map(n => n.lesson_id))
      // Obtener la fecha de actualización más reciente de todas las notas
      const lastUpdate = notes.length > 0 
        ? notes.reduce((latest, note) => {
            const noteDate = note.updated_at || note.created_at
            const latestDate = latest || ''
            return noteDate > latestDate ? noteDate : latest
          }, null as string | null)
        : null

      return {
        totalNotes: notes.length,
        lessonsWithNotes: uniqueLessonIds.size,
        totalLessons,
        lastUpdate
      }
    } catch (error) {
      throw error
    }
  }
}

