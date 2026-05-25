import type { createClient } from '@/lib/supabase/server'
import type { CourseSkillRow, UserSkillLevelRow } from './types'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

export async function fetchCourseSkills(
  supabase: SupabaseServerClient,
  courseId: string,
) {
  return supabase
    .from('course_skills')
    .select(`
      id,
      is_primary,
      is_required,
      proficiency_level,
      display_order,
      skills (
        skill_id,
        name,
        slug,
        description,
        category,
        icon_url,
        icon_type,
        icon_name,
        color,
        level
      )
    `)
    .eq('course_id', courseId)
    .order('display_order', { ascending: true })
    .order('is_primary', { ascending: false })
}

export async function addUserSkillLevels(
  supabase: SupabaseServerClient,
  courseSkills: CourseSkillRow[],
  userId?: string,
) {
  if (!userId) return courseSkills

  return Promise.all(
    courseSkills.map(async (courseSkill) => {
      const skillId = courseSkill.skills?.skill_id
      if (!skillId) return courseSkill

      const { data: levelData } = await supabase.rpc('get_user_skill_level', {
        p_user_id: userId,
        p_skill_id: skillId,
      })
      const userLevels: UserSkillLevelRow[] = levelData || []
      const levelInfo = userLevels.length > 0 ? userLevels[0] : null
      const userLevel = levelInfo?.level || null

      return {
        ...courseSkill,
        user_level: userLevel,
        user_course_count: levelInfo?.course_count || 0,
        user_badge_url: userLevel
          ? await fetchSkillBadgeUrl(supabase, skillId, userLevel)
          : null,
      }
    }),
  )
}

async function fetchSkillBadgeUrl(
  supabase: SupabaseServerClient,
  skillId: string,
  userLevel: string,
) {
  const { data: badgeData } = await supabase
    .from('skill_badges')
    .select('badge_url')
    .eq('skill_id', skillId)
    .eq('level', userLevel)
    .single()

  return badgeData?.badge_url || null
}
