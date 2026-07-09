import { NextRequest, NextResponse } from 'next/server'

import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface UserSkillRow {
  id: string
  skill_id: string
  course_id: string | null
  proficiency_level: string | null
  obtained_at: string | null
  is_displayed: boolean | null
  display_order: number | null
  skills: {
    skill_id: string
    name: string
    slug: string
    description: string | null
    category: string
    icon_url: string | null
    icon_type: string | null
    icon_name: string | null
    color: string | null
    level: string | null
  } | null
}

interface SkillLevelRow {
  skill_id: string
  level: string | null
  course_count: number
  next_level_courses_needed: number
}

interface SkillBadgeRow {
  skill_id: string
  level: string
  badge_url: string
}

/**
 * GET /api/users/[userId]/skills
 * Returns the user's skills with computed levels and badges.
 *
 * Fixed 3 round-trips regardless of skill count: user_skills+skills (1),
 * batched level RPC (1), badges for all skills (1). Previously this was
 * 2 queries PER skill (N+1).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    // Skills are personal data: only the owner can read them.
    if (currentUser.id !== userId) {
      return apiError(
        'USER_SKILLS_FORBIDDEN',
        'No autorizado para consultar estas skills',
        403,
      )
    }

    const supabase = await createClient()

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
      .returns<UserSkillRow[]>()

    if (userSkillsError) {
      logger.error('Error fetching user skills:', userSkillsError)
      return apiError(
        'USER_SKILLS_FETCH_FAILED',
        'Error al obtener skills del usuario',
        500,
      )
    }

    const skillRows = userSkills ?? []
    if (skillRows.length === 0) {
      return NextResponse.json({ success: true, skills: [] })
    }

    const skillIds = skillRows.map((row) => row.skill_id)

    const [levelsResult, badgesResult] = await Promise.all([
      supabase.rpc('get_user_skill_levels', {
        p_user_id: userId,
        p_skill_ids: skillIds,
      }),
      supabase
        .from('skill_badges')
        .select('skill_id, level, badge_url')
        .in('skill_id', skillIds)
        .returns<SkillBadgeRow[]>(),
    ])

    if (levelsResult.error) {
      logger.error('Error calculating skill levels:', levelsResult.error)
    }
    if (badgesResult.error) {
      logger.error('Error fetching skill badges:', badgesResult.error)
    }

    const levelsBySkill = new Map<string, SkillLevelRow>(
      ((levelsResult.data ?? []) as SkillLevelRow[]).map((row) => [
        row.skill_id,
        row,
      ]),
    )
    const badgeBySkillAndLevel = new Map<string, string>(
      (badgesResult.data ?? []).map((badge) => [
        `${badge.skill_id}:${badge.level}`,
        badge.badge_url,
      ]),
    )

    const skillsWithLevels = skillRows.map((userSkill) => {
      const levelInfo = levelsBySkill.get(userSkill.skill_id) ?? null
      const level = levelInfo?.level || null

      return {
        id: userSkill.id,
        skill_id: userSkill.skill_id,
        skill: userSkill.skills,
        course_id: userSkill.course_id,
        proficiency_level: userSkill.proficiency_level,
        obtained_at: userSkill.obtained_at,
        // null/undefined means visible (legacy rows without the flag).
        is_displayed: userSkill.is_displayed !== false,
        display_order: userSkill.display_order,
        level,
        course_count: levelInfo?.course_count || 0,
        badge_url: level
          ? badgeBySkillAndLevel.get(`${userSkill.skill_id}:${level}`) ?? null
          : null,
        next_level_courses_needed: levelInfo?.next_level_courses_needed || 0,
      }
    })

    return NextResponse.json({
      success: true,
      skills: skillsWithLevels,
    })
  } catch (error) {
    logger.error('💥 Error in /api/users/[userId]/skills GET:', error)
    return apiError('USER_SKILLS_INTERNAL_ERROR', 'Error interno del servidor', 500)
  }
}
