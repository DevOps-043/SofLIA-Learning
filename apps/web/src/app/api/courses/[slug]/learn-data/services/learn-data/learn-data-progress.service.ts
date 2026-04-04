import { createClient } from '@/lib/supabase/server'
import { fromLoose } from '@/lib/supabase/looseQuery'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

interface LessonNoteRow {
  lesson_id: string
  updated_at: string | null
}

export interface NotesStats {
  totalNotes: number
  lessonsWithNotes: string
  lastUpdate: string | null
}

export async function loadNotesStats(
  supabase: SupabaseServerClient,
  courseId: string,
  userId: string,
): Promise<NotesStats> {
  const { data: enrollment } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_id')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single()

  if (!enrollment) {
    return { totalNotes: 0, lessonsWithNotes: '0/0', lastUpdate: null }
  }

  const { data: notes } = await fromLoose<LessonNoteRow>(supabase, 'lesson_notes')
    .select('note_id, lesson_id, updated_at')
    .eq('enrollment_id', enrollment.enrollment_id)
    .order('updated_at', { ascending: false })

  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', courseId)

  let totalLessons = 0
  const moduleIds = (modules || []).map((module) => module.module_id)
  if (moduleIds.length > 0) {
    const { count } = await supabase
      .from('course_lessons')
      .select('lesson_id', { count: 'exact', head: true })
      .in('module_id', moduleIds)

    totalLessons = count || 0
  }

  const uniqueLessons = new Set((notes || []).map((note) => note.lesson_id))
  return {
    totalNotes: notes?.length || 0,
    lessonsWithNotes: `${uniqueLessons.size}/${totalLessons || 0}`,
    lastUpdate: notes && notes.length > 0 ? notes[0].updated_at : null,
  }
}
