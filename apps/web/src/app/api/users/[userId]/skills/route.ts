import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/users/[userId]/skills
 * Obtiene todas las skills del usuario con sus niveles calculados
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const supabase = await createClient()

    // Obtener skills del usuario
    const { data: userSkills, error: userSkillsError } = await supabase
      .from('user_skills')
      .select(`
        id,
        skill_id,
        course_id,
        proficiency_level,
        obtained_at,
        is_displayed,
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
      .eq('user_id', userId)
      .order('display_order', { ascending: true })
      .order('obtained_at', { ascending: false })

    if (userSkillsError) {
      logger.error('Error fetching user skills:', userSkillsError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener skills del usuario'
      }, { status: 500 })
    }

    // Para cada skill, calcular el nivel basado en cursos completados
    const skillsWithLevels = await Promise.all(
      (userSkills || []).map(async (userSkill) => {
        const skillId = userSkill.skill_id

        // Llamar a la función SQL para obtener nivel
        const { data: levelData, error: levelError } = await supabase
          .rpc('get_user_skill_level', {
            p_user_id: userId,
            p_skill_id: skillId
          })

        if (levelError) {
          logger.error('Error calculating skill level:', levelError)
        }

        const levelInfo = levelData && levelData.length > 0 ? levelData[0] : null
        const courseCount = levelInfo?.course_count || 0
        const level = levelInfo?.level || null
        const nextLevelCoursesNeeded = levelInfo?.next_level_courses_needed || 0

        // Obtener badge URL desde skill_badges si existe
        let badgeUrl = null
        if (level) {
          const { data: badgeData } = await supabase
            .from('skill_badges')
            .select('badge_url')
            .eq('skill_id', skillId)
            .eq('level', level)
            .single()

          badgeUrl = badgeData?.badge_url || null
        }

        return {
          id: userSkill.id,
          skill_id: skillId,
          skill: userSkill.skills,
          course_id: userSkill.course_id,
          proficiency_level: userSkill.proficiency_level,
          obtained_at: userSkill.obtained_at,
          is_displayed: userSkill.is_displayed !== false, // Si es null o undefined, tratarlo como true
          display_order: userSkill.display_order,
          level: level,
          course_count: courseCount,
          badge_url: badgeUrl,
          next_level_courses_needed: nextLevelCoursesNeeded
        }
      })
    )

    return NextResponse.json({
      success: true,
      skills: skillsWithLevels
    })
  } catch (error) {
    logger.error('💥 Error in /api/users/[userId]/skills GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
