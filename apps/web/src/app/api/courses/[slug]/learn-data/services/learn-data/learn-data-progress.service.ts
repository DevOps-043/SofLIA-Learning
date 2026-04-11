import type { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { NoteService } from '@/features/courses/services/note.service'

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseClient>>

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
  const notesStats = await NoteService.getNotesStatsWithClient(
    supabase,
    userId,
    courseId,
  )

  return {
    totalNotes: notesStats.totalNotes,
    lessonsWithNotes: `${notesStats.lessonsWithNotes}/${notesStats.totalLessons}`,
    lastUpdate: notesStats.lastUpdate,
  }
}
