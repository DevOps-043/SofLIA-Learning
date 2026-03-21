import { NextRequest, NextResponse } from 'next/server'
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/[orgSlug]/business/analytics/skills
 * Obtiene análisis de habilidades y gaps de conocimiento para la organización
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params
    const auth = await requireBusiness({ organizationSlug: orgSlug })
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

    // 🚀 OPTIMIZACIÓN: Query organization users filtrando por la organización actual
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

    // 🚀 OPTIMIZACIÓN: Obtener cursos completados para los usuarios de la organización
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

    // Obtener roles y mapear habilidades requeridas por rol (Mismo mapping que original)
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

    const categoryToSkillMapping: Record<string, string[]> = {
      'Desarrollo Web': ['Programación', 'HTML/CSS', 'JavaScript', 'Frameworks Web'],
      'Programación': ['Programación', 'Algoritmos', 'Estructuras de Datos'],
      'Marketing': ['Marketing Digital', 'SEO', 'Content Marketing', 'Redes Sociales'],
      'Diseño': ['Diseño Gráfico', 'UX/UI', 'Branding'],
      'Negocios': ['Gestión', 'Liderazgo', 'Finanzas', 'Estrategia'],
      'Tecnología': ['Cloud Computing', 'DevOps', 'Seguridad', 'Arquitectura']
    }

    const userSkills: Record<string, {
      learned: Set<string>
      courses: Array<{ id: string; title: string; category: string }>
    }> = {}

    completedCourses?.forEach((enrollment: any) => {
      const uId = enrollment.user_id
      if (!userSkills[uId]) {
        userSkills[uId] = { learned: new Set(), courses: [] }
      }

      const course = enrollment.courses
      if (course) {
        userSkills[uId].courses.push({
          id: course.id,
          title: course.title,
          category: course.category || 'General'
        })

        const skillsFromCategory = categoryToSkillMapping[course.category] || []
        skillsFromCategory.forEach(skill => userSkills[uId].learned.add(skill))

        if (course.learning_objectives && Array.isArray(course.learning_objectives)) {
          course.learning_objectives.forEach((obj: string) => {
            const keywords = ['programación', 'diseño', 'marketing', 'gestión', 'análisis', 'desarrollo', 'leadership']
            keywords.forEach(keyword => {
              if (obj.toLowerCase().includes(keyword)) {
                userSkills[uId].learned.add(keyword.charAt(0).toUpperCase() + keyword.slice(1))
              }
            })
          })
        }
      }
    })

    const gaps: Array<{
      user_id: string
      user_name: string
      user_role: string
      missing_skills: string[]
      learned_skills: string[]
    }> = []

    orgUsers?.forEach(orgUser => {
      const uId = orgUser.user_id
      const user = (orgUser as any).users
      if (!user || !targetUserIds.includes(uId)) return

      const roleName = user.type_rol || user.cargo_rol || 'General'
      const requiredSkills = roleSkillMapping[roleName] || []
      const learnedSkills = Array.from(userSkills[uId]?.learned || [])

      const missingSkills = requiredSkills.filter(skill => !learnedSkills.includes(skill))

      if (missingSkills.length > 0 || learnedSkills.length > 0) {
        gaps.push({
          user_id: uId,
          user_name: user.display_name || user.username || 'Usuario',
          user_role: roleName,
          missing_skills: missingSkills,
          learned_skills: learnedSkills
        })
      }
    })

    const skillToCourses: Record<string, Array<{ id: string; title: string; category: string }>> = {}

    completedCourses?.forEach((e: any) => {
      const course = e.courses
      if (!course) return

      const courseData = { id: course.id, title: course.title, category: course.category }

      const categorySkills = categoryToSkillMapping[course.category] || []
      categorySkills.forEach(skill => {
        if (!skillToCourses[skill]) skillToCourses[skill] = []
        if (!skillToCourses[skill].some(c => c.id === courseData.id)) {
          skillToCourses[skill].push(courseData)
        }
      })
    })

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
            recommended_courses: relevantCourses.slice(0, 3)
          })
        }
      })
    })

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
        total_users: targetUserIds.length,
        users_with_gaps: gaps.filter(g => g.missing_skills.length > 0).length,
        total_skills: new Set(gaps.flatMap(g => [...g.learned_skills, ...g.missing_skills])).size,
        skills_coverage: gaps.length > 0 ? Math.round((gaps.reduce((sum, g) => sum + g.learned_skills.length, 0) / gaps.reduce((sum, g) => sum + g.learned_skills.length + g.missing_skills.length, 0)) * 100) : 0,
        top_gaps: topGaps,
        top_learned: topLearned
      },
      gaps: gaps,
      recommendations: recommendations,
      user_skills: Object.entries(userSkills).map(([uid, data]) => ({
        user_id: uid,
        learned_skills: Array.from(data.learned),
        courses_count: data.courses.length
      }))
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/analytics/skills:', error)
    return NextResponse.json({ success: false, error: 'Error interno' }, { status: 500 })
  }
}
