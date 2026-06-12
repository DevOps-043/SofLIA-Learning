import type { createClient as createSupabaseClient } from '@/lib/supabase/server'
import type { createAdminClient } from '@/lib/supabase/admin'
import { NoteService } from '@/features/courses/services/note.service'

type SupabaseServerClient =
  | Awaited<ReturnType<typeof createSupabaseClient>>
  | ReturnType<typeof createAdminClient>

export interface NotesStats {
  totalNotes: number
  lessonsWithNotes: string
  lastUpdate: string | null
}

export async function loadNotesStats(
  supabase: SupabaseServerClient,
  courseId: string,
  userId: string,
  enrollmentId?: string | null,
): Promise<NotesStats> {
  const notesStats = await NoteService.getNotesStatsWithClient(
    supabase,
    userId,
    courseId,
    enrollmentId,
  )

  return {
    totalNotes: notesStats.totalNotes,
    lessonsWithNotes: `${notesStats.lessonsWithNotes}/${notesStats.totalLessons}`,
    lastUpdate: notesStats.lastUpdate,
  }
}
