import { NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { requireBusinessUser } from '@/lib/auth/requireBusiness'
import { createClient } from '@/lib/supabase/server'

interface DashboardStats {
  total_assigned: number
  in_progress: number
  completed: number
  certificates: number
}

interface AssignedCourse {
  id: string
  course_id: string
  title: string
  instructor: string
  progress: number
  status: 'Asignado' | 'En progreso' | 'Completado'
  thumbnail: string
  slug: string
  assigned_at: string
  due_date?: string
  completed_at?: string
  has_certificate?: boolean
  source?: 'direct' | 'team'
  learning_path_position?: number | null
}

interface LearningPathItemPositionRow {
  course_id: string
  position: number
  learning_path_id: string
}

interface RelatedCourseSummary {
  id: string
  title: string
  slug: string | null
  thumbnail_url: string | null
  instructor_id: string | null
}

type RelatedCourseValue = RelatedCourseSummary | RelatedCourseSummary[] | null

interface DirectAssignmentRow {
  id: string
  course_id: string
  status: string
  completion_percentage: number | null
  assigned_at: string
  due_date: string | null
  completed_at: string | null
  courses: RelatedCourseValue
}

interface TeamAssignmentRow {
  id: string
  team_id: string
  course_id: string
  status: string
  assigned_at: string
  due_date: string | null
  message: string | null
  courses: RelatedCourseValue
}

interface CombinedAssignmentRow extends DirectAssignmentRow {
  source: 'direct' | 'team'
}

interface EnrollmentRow {
  enrollment_id: string
  course_id: string
  overall_progress_percentage: number | null
  enrollment_status: string | null
  completed_at: string | null
}

interface InstructorRow {
  id: string
  first_name: string | null
  last_name: string | null
  username: string | null
}

interface CertificateRow {
  certificate_id: string
  course_id: string
}

function getRelatedCourseSummary(value: RelatedCourseValue): RelatedCourseSummary | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export async function GET() {
  try {
    const auth = await requireBusinessUser()
    if (auth instanceof NextResponse) {
      logger.error('Auth failed in business-user/dashboard:', auth.status)
      return auth
    }

    if (!auth.userId) {
      logger.error('No userId in auth object')
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no autenticado'
        },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const { userId, organizationId } = auth

    if (!organizationId) {
      logger.error('No organizationId in auth object for user:', userId)
      return NextResponse.json(
        {
          success: false,
          error: 'Error de contexto de organización'
        },
        { status: 400 }
      )
    }



    logger.log('📊 Fetching dashboard data for user:', userId, 'org:', organizationId)

    // =====================================================
    // 🚀 OPTIMIZACIÓN: FASE 1 - Consultas paralelas iniciales
    // Antes: 3 consultas secuenciales (~1.5s)
    // Después: 3 consultas en paralelo (~500ms)
    // =====================================================
    const [
      { data: userTeamMemberships, error: teamMembershipsError },
      { data: directAssignments, error: directAssignmentsError },
      { data: certificates, error: certificatesError }
    ] = await Promise.all([
      // PASO 1: Obtener los equipos a los que pertenece el usuario
      // 🔒 SEGURIDAD: Filtrar equipos que pertenecen a la organización actual
      supabase
        .from('work_team_members')
        .select('team_id, status, work_teams!inner(organization_id)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('work_teams.organization_id', organizationId),

      // PASO 2: Obtener asignaciones directas al usuario (límite 100)
      // 🔒 SEGURIDAD: Filtrar por organization_id
      supabase
        .from('organization_course_assignments')
        .select(`
          id,
          course_id,
          status,
          completion_percentage,
          assigned_at,
          due_date,
          completed_at,
          courses (
            id,
            title,
            slug,
            thumbnail_url,
            instructor_id
          )
        `)
        .eq('user_id', userId)
        .eq('organization_id', organizationId) // ✅ FILTRO CRÍTICO
        .in('status', ['assigned', 'in_progress', 'completed'])
        .order('assigned_at', { ascending: false })
        .limit(100),

      // PASO 3: Obtener certificados (en paralelo, límite 100)
      // Nota: Los certificados suelen ser globales del usuario, pero si quisiéramos filtrar
      // por org, necesitaríamos un join. Por ahora mantenemos histórico global o
      // asumimos que el frontend filtra/muestra contexto.
      supabase
        .from('user_course_certificates')
        .select('certificate_id, course_id')
        .eq('user_id', userId)
        .limit(100)
    ])

    if (teamMembershipsError) {
      logger.error('Error fetching team memberships:', teamMembershipsError)
    }
    if (directAssignmentsError) {
      logger.error('❌ Error fetching direct assignments:', directAssignmentsError)
    }
    if (certificatesError) {
      logger.error('❌ Error fetching certificates:', certificatesError)
    }

    const userTeamIds = userTeamMemberships?.map(m => m.team_id) || []
    
    // Debug log para verificar que los equipos son correctos
    logger.debug('Teams found for org:', organizationId, 'teams:', userTeamIds)

    // =====================================================
    // 🚀 OPTIMIZACIÓN: FASE 2 - Consultas dependientes en paralelo
    // =====================================================
    let teamCourseAssignments: TeamAssignmentRow[] = []
    let enrollmentsMap = new Map<string, EnrollmentRow>()
    const instructorMap = new Map<string, { name: string }>()

    // Preparar IDs de cursos de asignaciones directas
    const directCourseIds = new Set<string>()
    for (const assignment of (directAssignments || [])) {
      if (assignment.courses) {
        directCourseIds.add(assignment.course_id)
      }
    }

    // Solo hacer query de equipos si hay equipos
    const teamAssignmentsPromise = userTeamIds.length > 0
      ? supabase
          .from('work_team_course_assignments')
          .select(`
            id,
            team_id,
            course_id,
            status,
            assigned_at,
            due_date,
            message,
            courses (
              id,
              title,
              slug,
              thumbnail_url,
              instructor_id
            )
          `)
          .in('team_id', userTeamIds)
          .in('status', ['assigned', 'in_progress', 'completed'])
          .order('assigned_at', { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [], error: null })

    const { data: teamAssignments, error: teamAssignmentsError } = await teamAssignmentsPromise

    if (teamAssignmentsError) {
      logger.error('Error fetching team assignments:', teamAssignmentsError)
    }

    teamCourseAssignments = teamAssignments || []

    // Agregar course_ids de asignaciones de equipo
    for (const teamAssignment of teamCourseAssignments) {
      if (teamAssignment.courses) {
        directCourseIds.add(teamAssignment.course_id)
      }
    }

    // =====================================================
    // Combinar ambas fuentes evitando duplicados
    // =====================================================
    const courseIdSet = new Set<string>()
    const combinedAssignments: CombinedAssignmentRow[] = []

    // Primero agregar asignaciones directas
    for (const assignment of (directAssignments || [])) {
      if (assignment.courses && !courseIdSet.has(assignment.course_id)) {
        courseIdSet.add(assignment.course_id)
        combinedAssignments.push({
          ...assignment,
          source: 'direct'
        })
      }
    }

    // Luego agregar asignaciones de equipo que no estén duplicadas
    for (const teamAssignment of teamCourseAssignments) {
      if (teamAssignment.courses && !courseIdSet.has(teamAssignment.course_id)) {
        courseIdSet.add(teamAssignment.course_id)
        combinedAssignments.push({
          id: teamAssignment.id,
          course_id: teamAssignment.course_id,
          status: teamAssignment.status,
          completion_percentage: 0,
          assigned_at: teamAssignment.assigned_at,
          due_date: teamAssignment.due_date,
          completed_at: null,
          courses: teamAssignment.courses,
          source: 'team'
        })
      }
    }

    const courseIds = Array.from(courseIdSet)

    // =====================================================
    // 🚀 OPTIMIZACIÓN: FASE 3 - Enrollments e instructores en paralelo
    // =====================================================
    const instructorIds = [...new Set(combinedAssignments
      .map((a) => getRelatedCourseSummary(a.courses)?.instructor_id)
      .filter((id): id is string => Boolean(id)))]

    const [
      { data: enrollments, error: enrollmentsError },
      { data: instructors }
    ] = await Promise.all([
      // Enrollments (límite 100)
      courseIds.length > 0
        ? supabase
            .from('user_course_enrollments')
            .select('enrollment_id, course_id, overall_progress_percentage, enrollment_status, completed_at')
            .eq('user_id', userId)
            .in('course_id', courseIds)
            .limit(100)
        : Promise.resolve({ data: [], error: null }),

      // Instructores
      instructorIds.length > 0
        ? supabase
            .from('users')
            .select('id, first_name, last_name, username')
            .in('id', instructorIds)
        : Promise.resolve({ data: [] })
    ])

    if (!enrollmentsError && enrollments) {
      ;(enrollments as EnrollmentRow[]).forEach((enrollment) => {
        enrollmentsMap.set(enrollment.course_id, enrollment)
      })
    } else if (enrollmentsError) {
      logger.error('❌ Error fetching enrollments:', enrollmentsError)
    }

    if (instructors) {
      ;(instructors as InstructorRow[]).forEach((instructor) => {
        const fullName = `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim()
        instructorMap.set(instructor.id, {
          name: fullName || instructor.username || 'Instructor'
        })
      })
    }

    // Crear mapa de certificados
    const certificatesMap = new Map<string, boolean>()
    ;(certificates as CertificateRow[] | null)?.forEach((cert) => {
      certificatesMap.set(cert.course_id, true)
    })

    // =====================================================
    // Calcular estadísticas y transformar datos
    // =====================================================
    const totalAssigned = combinedAssignments.length

    const inProgress = combinedAssignments.filter(a => {
      const enrollment = enrollmentsMap.get(a.course_id)
      const progress = enrollment?.overall_progress_percentage || a.completion_percentage || 0
      return progress > 0 && progress < 100
    }).length

    const completed = combinedAssignments.filter(a => {
      const enrollment = enrollmentsMap.get(a.course_id)
      const progress = enrollment?.overall_progress_percentage || a.completion_percentage || 0
      return progress >= 100 || a.status === 'completed' || enrollment?.enrollment_status === 'completed'
    }).length

    const certificatesCount = certificates?.length || 0

    const stats: DashboardStats = {
      total_assigned: totalAssigned,
      in_progress: inProgress,
      completed: completed,
      certificates: certificatesCount
    }

    // Transformar asignaciones a formato de cursos
    const courses: AssignedCourse[] = combinedAssignments
      .map((assignment) => ({
        assignment,
        course: getRelatedCourseSummary(assignment.courses)
      }))
      .filter(
        (entry): entry is { assignment: CombinedAssignmentRow; course: RelatedCourseSummary } =>
          entry.course !== null
      )
      .map(({ assignment, course }) => {
        const instructor = course?.instructor_id ? instructorMap.get(course.instructor_id) : null
        const enrollment = enrollmentsMap.get(assignment.course_id)

        const actualProgress = enrollment?.overall_progress_percentage !== null && enrollment?.overall_progress_percentage !== undefined
          ? Number(enrollment.overall_progress_percentage)
          : (assignment.completion_percentage ? Number(assignment.completion_percentage) : 0)

        const actualCompletedAt = enrollment?.completed_at || assignment.completed_at
        const instructorName = instructor?.name || 'Instructor'

        let status: 'Asignado' | 'En progreso' | 'Completado' = 'Asignado'
        if (actualProgress >= 100 || assignment.status === 'completed' || enrollment?.enrollment_status === 'completed') {
          status = 'Completado'
        } else if (actualProgress > 0 || assignment.status === 'in_progress' || enrollment?.enrollment_status === 'active') {
          status = 'En progreso'
        }

        let thumbnail = course?.thumbnail_url || '📚'
        if (!course?.thumbnail_url) {
          const title = course?.title?.toLowerCase() || ''
          if (title.includes('python')) thumbnail = '🐍'
          else if (title.includes('ia') || title.includes('ai') || title.includes('generativa')) thumbnail = '🤖'
          else if (title.includes('diseño') || title.includes('ux') || title.includes('ui')) thumbnail = '🎨'
          else if (title.includes('machine learning') || title.includes('ml')) thumbnail = '🧠'
          else if (title.includes('datos') || title.includes('data')) thumbnail = '📊'
          else thumbnail = '📚'
        }

        return {
          id: assignment.id,
          course_id: assignment.course_id,
          title: course?.title || 'Curso sin título',
          instructor: instructorName,
          progress: Math.round(actualProgress * 100) / 100,
          status: status,
          thumbnail: thumbnail,
          slug: course?.slug || '',
          assigned_at: assignment.assigned_at,
          due_date: assignment.due_date || undefined,
          completed_at: actualCompletedAt || undefined,
          has_certificate: certificatesMap.has(assignment.course_id) || false,
          source: assignment.source
        }
      })

    // =====================================================
    // 🔢 Ordenar cursos según posición en learning paths
    // =====================================================
    if (courses.length > 0) {
      try {
        const assignedCourseIds = courses.map(c => c.course_id)

        const { data: lpItems, error: lpItemsError } = await supabase
          .from('learning_path_items')
          .select('course_id, position, learning_path_id')
          .in('course_id', assignedCourseIds)
          .order('position', { ascending: true })
          .returns<LearningPathItemPositionRow[]>()

        if (!lpItemsError && lpItems && lpItems.length > 0) {
          const coursePositionMap = new Map<string, number>()
          for (const item of lpItems) {
            const existingPos = coursePositionMap.get(item.course_id)
            if (existingPos === undefined || item.position < existingPos) {
              coursePositionMap.set(item.course_id, item.position)
            }
          }

          for (const course of courses) {
            const pos = coursePositionMap.get(course.course_id)
            if (pos !== undefined) {
              course.learning_path_position = pos
            }
          }

          courses.sort((a, b) => {
            const posA = a.learning_path_position ?? Infinity
            const posB = b.learning_path_position ?? Infinity
            return posA - posB
          })

          logger.log('🔢 Courses sorted by learning path position:', coursePositionMap.size, 'courses mapped')
        }
      } catch (sortError) {
        logger.error('Error sorting courses by learning path position:', sortError)
      }
    }

    logger.log('✅ Dashboard data prepared:', {
      stats,
      coursesCount: courses.length
    })

    return NextResponse.json({
      success: true,
      stats: stats,
      courses: courses
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    })
  } catch (error) {
    logger.error('💥 Error in /api/business-user/dashboard:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener datos del dashboard',
        stats: {
          total_assigned: 0,
          in_progress: 0,
          completed: 0,
          certificates: 0
        },
        courses: []
      },
      { status: 500 }
    )
  }
}
