import { NextResponse } from 'next/server'
import type { createClient } from '@/lib/supabase/server'
import type { CourseLookup } from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function resolveCourseByIdentifier(
  supabase: SupabaseServerClient,
  identifier: string,
) {
  const column = isUUID(identifier) ? 'id' : 'slug'
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id, instructor_id')
    .eq(column, identifier)
    .single()

  if (courseError || !courseData) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Curso no encontrado' },
        { status: 404 },
      ),
    }
  }

  return { course: courseData as CourseLookup }
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}
