import { NextRequest, NextResponse } from 'next/server'
import { requireBusinessCourseCatalog } from '@/features/business-panel/services/business-course-catalog-auth.server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCourseEnrollmentCounts } from '@/features/courses/services/course-enrollment-counts.server.service'
import { logger } from '@/lib/utils/logger'

interface RouteContext {
  params: Promise<{ orgSlug: string }>
}

/**
 * GET /api/[orgSlug]/business/courses
 * Obtiene todos los cursos disponibles para la organización especificada
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { orgSlug } = await context.params

    if (!orgSlug) {
      return NextResponse.json({
        success: false,
        error: 'Slug de organización requerido',
        courses: []
      }, { status: 400 })
    }

    // Verificar autenticación y acceso a esta organización específica
    const auth = await requireBusinessCourseCatalog({ organizationSlug: orgSlug })
    if (auth instanceof NextResponse) return auth

    const supabase = createAdminClient()

    // Single join query: cursos + datos del instructor en un solo round trip a Supabase.
    // Usar !instructor_id para indicar la FK explícita evita ambigüedad cuando hay
    // múltiples relaciones entre courses y users.
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        category,
        level,
        instructor_id,
        duration_total_minutes,
        thumbnail_url,
        slug,
        is_active,
        price,
        average_rating,
        student_count,
        review_count,
        learning_objectives,
        created_at,
        updated_at,
        instructor:users!instructor_id (
          id,
          first_name,
          last_name,
          display_name,
          username,
          email
        )
      `)
      .eq('is_active', true)
      .or('approval_status.eq.approved,approval_status.is.null')
      .order('created_at', { ascending: false })

    if (coursesError) {
      logger.error('Error fetching courses:', coursesError)
      return NextResponse.json({
        success: false,
        error: 'Error al obtener cursos',
        courses: []
      }, { status: 500 })
    }

    const enrollmentCounts = await getCourseEnrollmentCounts(
      supabase,
      (courses ?? []).map(course => course.id),
      auth.organizationId,
    )

    // Transformar datos — instructor ya viene embebido en cada fila
    const coursesWithInstructors = courses?.map(course => {
      const raw = course.instructor as {
        id: string
        first_name: string | null
        last_name: string | null
        display_name: string | null
        username: string | null
        email: string | null
      } | null

      const instructorName = raw
        ? (raw.display_name ||
           `${raw.first_name || ''} ${raw.last_name || ''}`.trim() ||
           raw.username ||
           'Instructor')
        : 'Instructor'

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        instructor: {
          id: raw?.id ?? course.instructor_id ?? '',
          name: instructorName,
          email: raw?.email ?? '',
        },
        duration: course.duration_total_minutes,
        thumbnail_url: course.thumbnail_url,
        slug: course.slug,
        price: course.price,
        rating: course.average_rating || 0,
        student_count: enrollmentCounts.get(course.id) ?? 0,
        review_count: course.review_count || 0,
        learning_objectives: course.learning_objectives,
        created_at: course.created_at,
        updated_at: course.updated_at
      }
    }) || []

    return NextResponse.json({
      success: true,
      courses: coursesWithInstructors
    }, {
      headers: {
        // Enrollment counts must reflect assignments made in the same session.
        'Cache-Control': 'private, no-store'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/[orgSlug]/business/courses:', error)
    return NextResponse.json({
      success: false,
      error: 'Error al obtener cursos',
      courses: []
    }, { status: 500 })
  }
}
