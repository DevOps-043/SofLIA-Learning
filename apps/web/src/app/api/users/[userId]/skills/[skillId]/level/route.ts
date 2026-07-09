import { NextRequest, NextResponse } from 'next/server'
import { SessionService } from '@/features/auth/services/session.service'
import { apiError } from '@/lib/api/errors'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/users/[userId]/skills/[skillId]/level
 * Obtiene nivel específico de una skill para un usuario
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; skillId: string }> }
) {
  try {
    const { userId, skillId } = await params
    const currentUser = await SessionService.getCurrentUser()

    if (!currentUser) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401)
    }

    // Skill progress is personal data: only the owner can read it.
    if (currentUser.id !== userId) {
      return apiError(
        'USER_SKILL_LEVEL_FORBIDDEN',
        'No autorizado para consultar esta skill',
        403,
      )
    }

    const supabase = await createClient()

    // Llamar a la función SQL para obtener nivel
    const { data: levelData, error: levelError } = await supabase
      .rpc('get_user_skill_level', {
        p_user_id: userId,
        p_skill_id: skillId
      })

    if (levelError) {
      logger.error('Error calculating skill level:', levelError)
      return NextResponse.json({
        success: false,
        error: 'Error al calcular el nivel de la skill'
      }, { status: 500 })
    }

    const levelInfo = levelData && levelData.length > 0 ? levelData[0] : null

    if (!levelInfo) {
      return NextResponse.json({
        success: false,
        error: 'No se encontró información del nivel'
      }, { status: 404 })
    }

    const courseCount = levelInfo.course_count || 0
    const level = levelInfo.level || null
    const nextLevelCoursesNeeded = levelInfo.next_level_courses_needed || 0

    // Obtener badge URL desde skill_badges si existe
    let badgeUrl = null
    let nextLevelInfo = null

    if (level) {
      const { data: badgeData } = await supabase
        .from('skill_badges')
        .select('badge_url')
        .eq('skill_id', skillId)
        .eq('level', level)
        .single()

      badgeUrl = badgeData?.badge_url || null

      // Obtener información del siguiente nivel si existe
      if (nextLevelCoursesNeeded > 0) {
        const nextLevel = 
          level === 'green' ? 'bronze' :
          level === 'bronze' ? 'silver' :
          level === 'silver' ? 'gold' :
          level === 'gold' ? 'diamond' : null

        if (nextLevel) {
          const { data: nextBadgeData } = await supabase
            .from('skill_badges')
            .select('badge_url')
            .eq('skill_id', skillId)
            .eq('level', nextLevel)
            .single()

          nextLevelInfo = {
            level: nextLevel,
            courses_needed: nextLevelCoursesNeeded,
            badge_url: nextBadgeData?.badge_url || null
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      level: level,
      course_count: courseCount,
      badge_url: badgeUrl,
      next_level_info: nextLevelInfo
    })
  } catch (error) {
    logger.error('💥 Error in /api/users/[userId]/skills/[skillId]/level GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

