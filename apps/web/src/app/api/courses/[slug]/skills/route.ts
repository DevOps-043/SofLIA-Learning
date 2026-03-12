import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../../../../../lib/supabase/server'
import { logger } from '../../../../../../lib/logger'
import { SessionService } from '../../../../../../features/auth/services/session.service'

/**
 * Función helper para detectar si un string es UUID
 */
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * GET /api/courses/[slug]/skills
 * Obtiene las skills asignadas a un curso
 * Acepta tanto slug como UUID como identificador
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: identifier } = await params
    const supabase = await createClient()

    // Intentar obtener usuario autenticado (opcional para lectura pública)
    const { data: { user } } = await supabase.auth.getUser()
    let auth = null
    
    if (user) {
      // Verificar que el usuario existe en la tabla users
      const { data: userData } = await supabase
        .from('users')
        .select('id, cargo_rol')
        .eq('id', user.id)
        .single()
      
      if (userData) {
        auth = { user: userData }
      }
    }

    // Determinar si el identificador es UUID o slug y buscar el curso
    let course
    let courseId: string

    if (isUUID(identifier)) {
      // Es un UUID, buscar directamente por ID
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, instructor_id')
        .eq('id', identifier)
        .single()

      if (courseError || !courseData) {
        return NextResponse.json({
          success: false,
          error: 'Curso no encontrado'
        }, { status: 404 })
      }

      course = courseData
      courseId = courseData.id
    } else {
      // Es un slug, buscar por slug
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, instructor_id')
        .eq('slug', identifier)
        .single()

      if (courseError || !courseData) {
        return NextResponse.json({
          success: false,
          error: 'Curso no encontrado'
        }, { status: 404 })
      }

      course = courseData
      courseId = courseData.id
    }

    // Obtener skills del curso
    const { data: courseSkills, error: skillsError } = await supabase
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

    if (skillsError) {
      logger.error('Error fetching course skills:', skillsError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener skills del curso'
      }, { status: 500 })
    }

    // Si hay usuario autenticado, obtener niveles para cada skill
    let skillsWithUserLevels = courseSkills || []
    if (auth && auth.user) {
      skillsWithUserLevels = await Promise.all(
        (courseSkills || []).map(async (cs: any) => {
          const skillId = cs.skills?.skill_id
          if (!skillId) return cs

          // Llamar a la función SQL para obtener nivel del usuario
          const { data: levelData } = await supabase
            .rpc('get_user_skill_level', {
              p_user_id: auth.user.id,
              p_skill_id: skillId
            })

          const levelInfo = levelData && levelData.length > 0 ? levelData[0] : null
          const userLevel = levelInfo?.level || null
          const courseCount = levelInfo?.course_count || 0

          // Obtener badge URL si existe
          let badgeUrl = null
          if (userLevel) {
            const { data: badgeData } = await supabase
              .from('skill_badges')
              .select('badge_url')
              .eq('skill_id', skillId)
              .eq('level', userLevel)
              .single()

            badgeUrl = badgeData?.badge_url || null
          }

          return {
            ...cs,
            user_level: userLevel,
            user_course_count: courseCount,
            user_badge_url: badgeUrl
          }
        })
      )
    }

    return NextResponse.json({
      success: true,
      skills: skillsWithUserLevels.map((cs: any) => ({
        id: cs.id,
        skill_id: cs.skills?.skill_id,
        name: cs.skills?.name,
        slug: cs.skills?.slug,
        description: cs.skills?.description,
        category: cs.skills?.category,
        icon_url: cs.skills?.icon_url,
        icon_type: cs.skills?.icon_type,
        icon_name: cs.skills?.icon_name,
        color: cs.skills?.color,
        level: cs.skills?.level,
        is_primary: cs.is_primary,
        is_required: cs.is_required,
        proficiency_level: cs.proficiency_level,
        display_order: cs.display_order,
        user_level: cs.user_level || null,
        user_course_count: cs.user_course_count || 0,
        user_badge_url: cs.user_badge_url || null
      }))
    })
  } catch (error) {
    logger.error('💥 Error in /api/courses/[slug]/skills GET:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

/**
 * POST /api/courses/[slug]/skills
 * Asigna skills a un curso
 * Acepta tanto slug como UUID como identificador
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: identifier } = await params
    const supabase = await createClient()

    // Verificar autenticación
    const currentUser = await SessionService.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({
        success: false,
        error: 'No autenticado'
      }, { status: 401 })
    }

    // Determinar si el identificador es UUID o slug y buscar el curso
    let course
    let courseId: string

    if (isUUID(identifier)) {
      // Es un UUID, buscar directamente por ID
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, instructor_id')
        .eq('id', identifier)
        .single()

      if (courseError || !courseData) {
        return NextResponse.json({
          success: false,
          error: 'Curso no encontrado'
        }, { status: 404 })
      }

      course = courseData
      courseId = courseData.id
    } else {
      // Es un slug, buscar por slug
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, instructor_id')
        .eq('slug', identifier)
        .single()

      if (courseError || !courseData) {
        return NextResponse.json({
          success: false,
          error: 'Curso no encontrado'
        }, { status: 404 })
      }

      course = courseData
      courseId = courseData.id
    }

    // Obtener información del usuario para verificar rol
    const { data: userData } = await supabase
      .from('users')
      .select('id, cargo_rol')
      .eq('id', currentUser.id)
      .single()

    if (!userData) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no encontrado'
      }, { status: 404 })
    }

    // Verificar permisos: instructor del curso o admin
    const isInstructor = course.instructor_id === currentUser.id
    const isAdmin = userData.cargo_rol?.toLowerCase().trim() === 'administrador'

    if (!isInstructor && !isAdmin) {
      return NextResponse.json({
        success: false,
        error: 'No tienes permisos para editar este curso'
      }, { status: 403 })
    }

    const body = await request.json()
    const { skills } = body

    if (!Array.isArray(skills)) {
      return NextResponse.json({
        success: false,
        error: 'Skills debe ser un array'
      }, { status: 400 })
    }

    // Eliminar skills existentes del curso
    const { error: deleteError } = await supabase
      .from('course_skills')
      .delete()
      .eq('course_id', courseId)

    if (deleteError) {
      logger.error('Error deleting course skills:', deleteError)
      return NextResponse.json({
        success: false,
        error: 'Error al eliminar skills existentes'
      }, { status: 500 })
    }

    // Insertar nuevas skills
    if (skills.length > 0) {
      const courseSkillsToInsert = skills.map((skill: any, index: number) => ({
        course_id: courseId,
        skill_id: skill.skill_id,
        is_primary: skill.is_primary || false,
        is_required: skill.is_required !== false,
        proficiency_level: skill.proficiency_level || 'beginner',
        display_order: skill.display_order !== undefined ? skill.display_order : index
      }))

      const { error: insertError } = await supabase
        .from('course_skills')
        .insert(courseSkillsToInsert)

      if (insertError) {
        logger.error('Error inserting course skills:', insertError)
        return NextResponse.json({
          success: false,
          error: 'Error al asignar skills al curso'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Skills asignadas correctamente'
    })
  } catch (error) {
    logger.error('💥 Error in /api/courses/[slug]/skills POST:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

