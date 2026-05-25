import { NextResponse } from 'next/server'
import type { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import type { CourseSkillInput } from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function replaceCourseSkills(
  supabase: SupabaseServerClient,
  courseId: string,
  skills: CourseSkillInput[],
) {
  const { error: deleteError } = await supabase
    .from('course_skills')
    .delete()
    .eq('course_id', courseId)

  if (deleteError) {
    logger.error('Error deleting course skills:', deleteError)
    return NextResponse.json(
      { success: false, error: 'Error al eliminar skills existentes' },
      { status: 500 },
    )
  }

  if (skills.length === 0) return null

  const courseSkillsToInsert = skills.map((skill, index) => ({
    course_id: courseId,
    skill_id: skill.skill_id,
    is_primary: skill.is_primary || false,
    is_required: skill.is_required !== false,
    proficiency_level: skill.proficiency_level || 'beginner',
    display_order: skill.display_order !== undefined ? skill.display_order : index,
  }))

  const { error: insertError } = await supabase
    .from('course_skills')
    .insert(courseSkillsToInsert)

  if (!insertError) return null

  logger.error('Error inserting course skills:', insertError)
  return NextResponse.json(
    { success: false, error: 'Error al asignar skills al curso' },
    { status: 500 },
  )
}
