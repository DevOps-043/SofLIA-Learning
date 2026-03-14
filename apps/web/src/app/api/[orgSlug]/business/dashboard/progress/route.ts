import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger';
import { requireBusiness } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

interface CourseProgress {
  label: string;
  progress: number;
  students: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgSlug: string }> }
) {
  try {
    const { orgSlug } = await params

    const auth = await requireBusiness({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    if (!auth.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No tienes una organización asignada'
        },
        { status: 403 }
      )
    }

    const supabase = await createClient()
    const organizationId = auth.organizationId

    // Obtener todos los cursos asignados con información del curso
    const { data: assignments, error: assignmentsError } = await supabase
      .from('organization_course_assignments')
      .select(`
        course_id,
        completion_percentage,
        course:courses!inner (
          id,
          title
        )
      `)
      .eq('organization_id', organizationId)

    if (assignmentsError) {
      logger.error('Error fetching course assignments:', assignmentsError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener asignaciones de cursos',
        courses: []
      }, { status: 500 })
    }

    // Agrupar por curso y calcular estadísticas
    const courseMap = new Map<string, {
      title: string;
      progressSum: number;
      students: number;
    }>()

    assignments?.forEach((assignment: any) => {
      const courseId = assignment.course_id
      const courseTitle = assignment.course?.title || 'Curso sin título'
      const progress = assignment.completion_percentage || 0

      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          title: courseTitle,
          progressSum: 0,
          students: 0
        })
      }

      const courseData = courseMap.get(courseId)!
      courseData.progressSum += progress
      courseData.students += 1
    })

    // Convertir a array y calcular promedio de progreso
    const courses: CourseProgress[] = Array.from(courseMap.values()).map(course => ({
      label: course.title,
      progress: course.students > 0 ? Math.round(course.progressSum / course.students) : 0,
      students: course.students
    }))

    // Ordenar por número de estudiantes (descendente) y limitar a los top 10
    courses.sort((a, b) => b.students - a.students)

    return NextResponse.json({
      success: true,
      courses: courses.slice(0, 10)
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/dashboard/progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener resumen de progreso',
        courses: []
      },
      { status: 500 }
    )
  }
}
