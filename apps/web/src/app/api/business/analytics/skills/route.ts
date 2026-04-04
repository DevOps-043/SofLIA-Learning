import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

interface OrganizationAnalyticsUser {
  id: string
  cargo_rol: string | null
  type_rol: string | null
  display_name: string | null
  username: string | null
}

interface OrganizationUserRow {
  user_id: string
  users: OrganizationAnalyticsUser | null
}

interface AnalyticsCourseRow {
  id: string
  title: string
  category: string | null
  learning_objectives: string[] | null
  level: string | null
}

interface CompletedEnrollmentRow {
  user_id: string
  course_id: string
  overall_progress_percentage: number | null
  completed_at: string | null
  courses: AnalyticsCourseRow | null
}

/**
 * GET /api/business/analytics/skills
 * Obtiene análisis de habilidades y gaps de conocimiento para la organización
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireBusiness()
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json({
        success: false,
        error: 'Usuario no pertenece a ninguna organización'
      }, { status: 400 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')

    // 🚀 OPTIMIZACIÓN: Query organization users sin esperar para obtener targetUserIds
    const { data: orgUsers, error: orgUsersError } = await supabase
      .from('organization_users')
      .select('user_id, users!organization_users_user_id_fkey(id, cargo_rol, type_rol, display_name, username)')
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')

    if (orgUsersError) {
      logger.error('Error fetching organization users:', orgUsersError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener usuarios'
      }, { status: 500 })
    }

    const targetUserIds = userId
      ? [userId]
      : orgUsers?.map(ou => ou.user_id).filter(Boolean) || []

    if (targetUserIds.length === 0) {
      return NextResponse.json({
        success: true,
        skills: [],
        gaps: [],
        recommendations: []
      })
    }

    // 🚀 OPTIMIZACIÓN: Obtener cursos completados (ahora ya conocemos targetUserIds)
    const { data: completedCourses, error: coursesError } = await supabase
      .from('user_course_enrollments')
      .select(`
        user_id,
        course_id,
        overall_progress_percentage,
        completed_at,
        courses!inner(
          id,
          title,
          category,
          learning_objectives,
          level
        )
      `)
      .in('user_id', targetUserIds)
      .eq('enrollment_status', 'completed')

    if (coursesError) {
      logger.error('Error fetching completed courses:', coursesError)
    }

    // Obtener roles y mapear habilidades requeridas por rol
    const roleSkillMapping: Record<string, string[]> = {
      'CTO / Director(a) de Tecnología': ['Programación', 'Arquitectura de Software', 'DevOps', 'Cloud Computing', 'Seguridad', 'Gestión de Equipos'],
      'Gerente de TI': ['Administración de Sistemas', 'Networking', 'Seguridad Informática', 'Gestión de Proyectos'],
      'Analista/Especialista TI': ['Programación', 'Bases de Datos', 'Testing', 'Documentación'],
      'CEO': ['Liderazgo', 'Estrategia', 'Finanzas', 'Gestión de Personas', 'Innovación'],
      'CMO / Director(a) de Marketing': ['Marketing Digital', 'SEO', 'Redes Sociales', 'Análisis de Datos', 'Publicidad'],
      'Gerente de Marketing': ['Content Marketing', 'Email Marketing', 'SEO', 'Analytics'],
      'Líder/Gerente de Ventas': ['Ventas', 'Negociación', 'CRM', 'Gestión de Clientes', 'Comunicación'],
      'Educación/Docentes': ['Pedagogía', 'Didáctica', 'Tecnología Educativa', 'Evaluación'],
      'Diseño/Industrias Creativas': ['Diseño Gráfico', 'UX/UI', 'Branding', 'Fotografía', 'Ilustración']
    }

    // Mapear categorías de cursos a habilidades
    const categoryToSkillMapping: Record<string, string[]> = {
      'Desarrollo Web': ['Programación', 'HTML/CSS', 'JavaScript', 'Frameworks Web'],
      'Programación': ['Programación', 'Algoritmos', 'Estructuras de Datos'],
      'Marketing': ['Marketing Digital', 'SEO', 'Content Marketing', 'Redes Sociales'],
      'Diseño': ['Diseño Gráfico', 'UX/UI', 'Branding'],
      'Negocios': ['Gestión', 'Liderazgo', 'Finanzas', 'Estrategia'],
      'Tecnología': ['Cloud Computing', 'DevOps', 'Seguridad', 'Arquitectura']
    }

    // Procesar habilidades aprendidas por usuario
    const userSkills: Record<string, {
      learned: Set<string>
      courses: Array<{ id: string; title: string; category: string }>
    }> = {}

    (completedCourses as CompletedEnrollmentRow[] | null)?.forEach((enrollment) => {
      const userId = enrollment.user_id
      if (!userSkills[userId]) {
        userSkills[userId] = { learned: new Set(), courses: [] }
      }

      const course = enrollment.courses
      if (course) {
        userSkills[userId].courses.push({
          id: course.id,
          title: course.title,
          category: course.category || 'General'
        })

        // Extraer habilidades de categoría
        const skillsFromCategory = categoryToSkillMapping[course.category] || []
        skillsFromCategory.forEach(skill => userSkills[userId].learned.add(skill))

        // Extraer habilidades de learning_objectives si existe
        if (course.learning_objectives && Array.isArray(course.learning_objectives)) {
          course.learning_objectives.forEach((obj: string) => {
            // Buscar palabras clave que puedan indicar habilidades
            const keywords = ['programación', 'diseño', 'marketing', 'gestión', 'análisis', 'desarrollo', 'leadership']
            keywords.forEach(keyword => {
              if (obj.toLowerCase().includes(keyword)) {
                userSkills[userId].learned.add(keyword.charAt(0).toUpperCase() + keyword.slice(1))
              }
            })
          })
        }
      }
    })

    // Identificar gaps de conocimiento por usuario
    const gaps: Array<{
      user_id: string
      user_name: string
      user_role: string
      missing_skills: string[]
      learned_skills: string[]
    }> = []

    (orgUsers as OrganizationUserRow[] | null)?.forEach((orgUser) => {
      const userId = orgUser.user_id
      const user = orgUser.users
      if (!user || !targetUserIds.includes(userId)) return

      const roleName = user.type_rol || user.cargo_rol || 'General'
      const requiredSkills = roleSkillMapping[roleName] || []
      const learnedSkills = Array.from(userSkills[userId]?.learned || [])

      const missingSkills = requiredSkills.filter(skill => !learnedSkills.includes(skill))

      if (missingSkills.length > 0 || learnedSkills.length > 0) {
        gaps.push({
          user_id: userId,
          user_name: user.display_name || user.username || 'Usuario',
          user_role: roleName,
          missing_skills: missingSkills,
          learned_skills: learnedSkills
        })
      }
    })

    // 🚀 OPTIMIZACIÓN: Crear índice de cursos por habilidad una sola vez
    // Antes: O(gaps * missing_skills * completedCourses) = O(n³)
    // Después: O(completedCourses) para indexar + O(gaps * missing_skills) para lookup = O(n²)
    const skillToCourses: Record<string, Array<{ id: string; title: string; category: string }>> = {}

    (completedCourses as CompletedEnrollmentRow[] | null)?.forEach((e) => {
      const course = e.courses
      if (!course) return

      const courseData = {
        id: course.id,
        title: course.title,
        category: course.category
      }

      // Index by category skills
      const categorySkills = categoryToSkillMapping[course.category] || []
      categorySkills.forEach(skill => {
        if (!skillToCourses[skill]) skillToCourses[skill] = []
        if (!skillToCourses[skill].some(c => c.id === courseData.id)) {
          skillToCourses[skill].push(courseData)
        }
      })

      // Index by learning objectives
      if (course.learning_objectives && Array.isArray(course.learning_objectives)) {
        course.learning_objectives.forEach((obj: string) => {
          const objLower = obj.toLowerCase()
          Object.keys(roleSkillMapping).forEach(role => {
            roleSkillMapping[role].forEach(skill => {
              if (objLower.includes(skill.toLowerCase())) {
                if (!skillToCourses[skill]) skillToCourses[skill] = []
                if (!skillToCourses[skill].some(c => c.id === courseData.id)) {
                  skillToCourses[skill].push(courseData)
                }
              }
            })
          })
        })
      }
    })

    // Generar recomendaciones usando el índice
    const recommendations: Array<{
      user_id: string
      gap_skill: string
      recommended_courses: Array<{ id: string; title: string; category: string }>
    }> = []

    gaps.forEach(gap => {
      gap.missing_skills.forEach(skill => {
        const relevantCourses = skillToCourses[skill] || []
        if (relevantCourses.length > 0) {
          recommendations.push({
            user_id: gap.user_id,
            gap_skill: skill,
            recommended_courses: relevantCourses.slice(0, 3) // Top 3 cursos
          })
        }
      })
    })

    // Estadísticas agregadas
    const totalUsers = targetUserIds.length
    const usersWithGaps = gaps.filter(g => g.missing_skills.length > 0).length
    const totalSkills = new Set(
      gaps.flatMap(g => [...g.learned_skills, ...g.missing_skills])
    ).size
    const skillsCoverage = gaps.length > 0
      ? Math.round(
          (gaps.reduce((sum, g) => sum + g.learned_skills.length, 0) /
           gaps.reduce((sum, g) => sum + g.learned_skills.length + g.missing_skills.length, 0)) * 100
        )
      : 0

    // Top habilidades faltantes
    const skillGapCount: Record<string, number> = {}
    gaps.forEach(gap => {
      gap.missing_skills.forEach(skill => {
        skillGapCount[skill] = (skillGapCount[skill] || 0) + 1
      })
    })

    const topGaps = Object.entries(skillGapCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }))

    // Top habilidades aprendidas
    const learnedSkillCount: Record<string, number> = {}
    gaps.forEach(gap => {
      gap.learned_skills.forEach(skill => {
        learnedSkillCount[skill] = (learnedSkillCount[skill] || 0) + 1
      })
    })

    const topLearned = Object.entries(learnedSkillCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }))

    return NextResponse.json({
      success: true,
      stats: {
        total_users: totalUsers,
        users_with_gaps: usersWithGaps,
        total_skills: totalSkills,
        skills_coverage: skillsCoverage,
        top_gaps: topGaps,
        top_learned: topLearned
      },
      gaps: gaps,
      recommendations: recommendations,
      user_skills: Object.entries(userSkills).map(([userId, data]) => ({
        user_id: userId,
        learned_skills: Array.from(data.learned),
        courses_count: data.courses.length
      }))
    }, {
      headers: {
        'Cache-Control': 'private, max-age=120, stale-while-revalidate=240'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business/analytics/skills:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}
