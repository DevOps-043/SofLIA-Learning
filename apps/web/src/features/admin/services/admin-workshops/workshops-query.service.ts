import { createClient } from '../../../../lib/supabase/server'
import type {
  AdminWorkshop,
  AdminWorkshopListFilters,
  AdminWorkshopListResult,
  WorkshopStats,
} from './workshops-transform.service'

interface CourseWorkshopRow extends AdminWorkshop {
  instructor_id: string | null
}

interface InstructorLookupRow {
  id: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
  profile_picture_url: string | null
}

function normalizeSearchTerm(search?: string) {
  return search?.trim().replace(/[%_,()]/g, '') || ''
}

function getPaginationBounds(page: number, limit: number) {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Math.floor(limit), 1), 48) : 24
  const from = (safePage - 1) * safeLimit
  const to = from + safeLimit - 1

  return { safePage, safeLimit, from, to }
}

function getInstructorDisplayName(instructor: InstructorLookupRow) {
  return instructor.display_name ||
    `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
    'Instructor no asignado'
}

function enrichWorkshops(input: {
  courses: CourseWorkshopRow[]
  instructors: InstructorLookupRow[]
  modules: Array<{ course_id: string; module_duration_minutes: number | null }>
  enrollments: Array<{ course_id: string }>
}): AdminWorkshop[] {
  const instructorsMap = new Map<string, { name: string; picture: string | null }>(
    input.instructors.map((instructor) => [
      instructor.id,
      {
        name: getInstructorDisplayName(instructor),
        picture: instructor.profile_picture_url,
      },
    ]),
  )

  const durationMap = new Map<string, number>()
  for (const module of input.modules) {
    const current = durationMap.get(module.course_id) || 0
    durationMap.set(module.course_id, current + (module.module_duration_minutes || 0))
  }

  const enrollmentsMap = new Map<string, number>()
  for (const enrollment of input.enrollments) {
    const current = enrollmentsMap.get(enrollment.course_id) || 0
    enrollmentsMap.set(enrollment.course_id, current + 1)
  }

  return input.courses.map((workshop): AdminWorkshop => {
    const instructor = workshop.instructor_id ? instructorsMap.get(workshop.instructor_id) : null
    const calculatedDuration = durationMap.get(workshop.id) || 0

    return {
      ...workshop,
      instructor_id: workshop.instructor_id || '',
      duration_total_minutes: calculatedDuration > 0 ? calculatedDuration : (workshop.duration_total_minutes || 0),
      student_count: enrollmentsMap.get(workshop.id) || 0,
      instructor_name: instructor?.name || 'Instructor no asignado',
      instructor_profile_picture_url: instructor?.picture || null,
    }
  })
}

export class AdminWorkshopsQueryService {
  static async getWorkshopsPage(filters: AdminWorkshopListFilters): Promise<AdminWorkshopListResult> {
    const supabase = await createClient()
    const { safePage, safeLimit, from, to } = getPaginationBounds(filters.page, filters.limit)
    const searchTerm = normalizeSearchTerm(filters.search)
    const category = filters.category?.trim()

    let instructorIds: string[] = []
    if (searchTerm) {
      const { data: matchingInstructors, error: instructorSearchError } = await supabase
        .from('users')
        .select('id')
        .or(`display_name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(50)

      if (instructorSearchError) {
        throw instructorSearchError
      }

      instructorIds = (matchingInstructors || []).map((instructor) => instructor.id)
    }

    let query = supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        category,
        level,
        duration_total_minutes,
        instructor_id,
        is_active,
        thumbnail_url,
        slug,
        price,
        average_rating,
        student_count,
        review_count,
        learning_objectives,
        approval_status,
        approved_by,
        approved_at,
        rejection_reason,
        created_at,
        updated_at
      `, { count: 'exact' })
      .or('approval_status.eq.approved,approval_status.is.null')

    if (searchTerm) {
      const searchFilters = [
        `title.ilike.%${searchTerm}%`,
        `description.ilike.%${searchTerm}%`,
        `category.ilike.%${searchTerm}%`,
      ]

      if (instructorIds.length > 0) {
        searchFilters.push(`instructor_id.in.(${instructorIds.join(',')})`)
      }

      query = query.or(searchFilters.join(','))
    }

    if (category && category !== 'all') {
      query = query.ilike('category', category)
    }

    if (filters.status === 'active') {
      query = query.eq('is_active', true)
    }

    if (filters.status === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data: courses, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
      .returns<CourseWorkshopRow[]>()

    if (error) {
      throw error
    }

    if (!courses || courses.length === 0) {
      return {
        workshops: [],
        pagination: {
          page: safePage,
          limit: safeLimit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / safeLimit),
        },
      }
    }

    const courseIds = courses.map((course) => course.id)
    const pageInstructorIds = [...new Set(courses.map((course) => course.instructor_id).filter(Boolean))]

    const [instructorsResult, modulesResult, assignmentsResult] = await Promise.all([
      pageInstructorIds.length > 0
        ? supabase
            .from('users')
            .select('id, display_name, first_name, last_name, profile_picture_url')
            .in('id', pageInstructorIds)
            .returns<InstructorLookupRow[]>()
        : Promise.resolve({ data: [] as InstructorLookupRow[], error: null }),
      supabase
        .from('course_modules')
        .select('course_id, module_duration_minutes')
        .in('course_id', courseIds)
        .returns<Array<{ course_id: string; module_duration_minutes: number | null }>>(),
      supabase
        .from('user_course_enrollments')
        .select('course_id')
        .in('course_id', courseIds)
        .eq('enrollment_status', 'active')
        .returns<Array<{ course_id: string }>>(),
    ])

    if (instructorsResult.error) throw instructorsResult.error
    if (modulesResult.error) throw modulesResult.error
    if (assignmentsResult.error) throw assignmentsResult.error

    return {
      workshops: enrichWorkshops({
        courses,
        instructors: instructorsResult.data || [],
        modules: modulesResult.data || [],
        enrollments: assignmentsResult.data || [],
      }),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / safeLimit),
      },
    }
  }

  /**
   * 🚀 OPTIMIZADO: Eliminado problema N+1
   * Antes: 2N queries adicionales (instructor + módulos por cada curso)
   * Después: 3 queries en paralelo total
   */
  static async getAllWorkshops(): Promise<AdminWorkshop[]> {
    const supabase = await createClient()

    try {
      // 🚀 PASO 1: Obtener todos los cursos
      const { data: courses, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          category,
          level,
          duration_total_minutes,
          instructor_id,
          is_active,
          thumbnail_url,
          slug,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          approval_status,
          approved_by,
          approved_at,
          rejection_reason,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      if (!courses || courses.length === 0) {
        return []
      }

      // 🚀 PASO 2: Recopilar IDs únicos para batch queries
      const courseIds = courses.map((c: { id: string }) => c.id)
      const instructorIds = [...new Set(courses.map((c: { instructor_id: string | null }) => c.instructor_id).filter(Boolean))]

      // 🚀 PASO 3: Ejecutar queries en paralelo (no secuenciales)
      const [instructorsResult, modulesResult, assignmentsResult] = await Promise.all([
        // Query de instructores (una sola query para todos)
        instructorIds.length > 0
          ? supabase
            .from('users')
            .select('id, display_name, first_name, last_name, profile_picture_url')
            .in('id', instructorIds)
          : Promise.resolve({ data: [] }),

        // Query de módulos (una sola query para todos los cursos)
        supabase
          .from('course_modules')
          .select('course_id, module_duration_minutes')
          .in('course_id', courseIds),

        // Query de enrollments activos (una sola query para todos los cursos)
        // Obtenemos solo course_id para contar en memoria
        supabase
          .from('user_course_enrollments')
          .select('course_id')
          .in('course_id', courseIds)
          .eq('enrollment_status', 'active')
      ])

      // 🚀 PASO 4: Crear mapas para búsqueda O(1)
      const instructorsMap = new Map<string, {name: string, picture: string | null}>((instructorsResult.data || []).map((instructor: { id: string; display_name: string | null; first_name: string | null; last_name: string | null; profile_picture_url: string | null }) => [
        instructor.id,
        {
          name: instructor.display_name ||
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor no asignado',
          picture: instructor.profile_picture_url
        }
      ]))

      // Calcular duración por curso
      const durationMap = new Map<string, number>()
      for (const module of (modulesResult.data || [])) {
        const current = durationMap.get(module.course_id) || 0
        durationMap.set(module.course_id, current + (module.module_duration_minutes || 0))
      }

      // Calcular estudiantes activos por curso (Source of Truth: user_course_enrollments)
      // Esto reemplaza al contador de la tabla courses que puede estar desactualizado
      const enrollmentsMap = new Map<string, number>()
      for (const enrollment of (assignmentsResult.data || [])) {
        const current = enrollmentsMap.get(enrollment.course_id) || 0
        enrollmentsMap.set(enrollment.course_id, current + 1)
      }

      // 🚀 PASO 5: Enriquecer cursos sin queries adicionales
      const workshopsWithData = (courses as AdminWorkshop[]).map((workshop): AdminWorkshop => {
        const instructor = workshop.instructor_id ? instructorsMap.get(workshop.instructor_id) : null
        const calculatedDuration = durationMap.get(workshop.id) || 0

        return {
          ...workshop,
          duration_total_minutes: calculatedDuration > 0 ? calculatedDuration : (workshop.duration_total_minutes || 0),
          student_count: enrollmentsMap.get(workshop.id) || 0, // Usar el conteo real calculado
          instructor_name: instructor?.name || 'Instructor no asignado',
          instructor_profile_picture_url: instructor?.picture || null
        }
      })

      return workshopsWithData
    } catch (error) {
      throw error
    }
  }

  /**
   * 🚀 OPTIMIZADO: Queries en paralelo
   * Antes: 5 queries secuenciales
   * Después: 2 queries en paralelo + 1 query para instructores únicos
   */
  static async getWorkshopStats(): Promise<WorkshopStats> {
    const supabase = await createClient()

    try {
      // 🚀 OPTIMIZACIÓN: Ejecutar queries en paralelo
      const [
        { count: totalWorkshops },
        { count: activeWorkshops },
        { data: coursesData },
        { data: assignmentsData }
      ] = await Promise.all([
        // Conteo total
        supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .or('approval_status.eq.approved,approval_status.is.null'),

        // Conteo activos
        supabase
          .from('courses')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .or('approval_status.eq.approved,approval_status.is.null'),

        // Datos para calcular estudiantes, duración e instructores
        supabase
          .from('courses')
          .select('student_count, duration_total_minutes, instructor_id')
          .or('approval_status.eq.approved,approval_status.is.null'),

        // Datos de enrollments activos para contar estudiantes reales
        supabase
          .from('user_course_enrollments')
          .select('course_id') // Solo necesitamos ID para contar
          .eq('enrollment_status', 'active')
      ])

      // Calcular estadísticas en cliente (más eficiente que múltiples queries)
      let totalStudents = 0
      let totalDuration = 0
      let coursesWithDuration = 0
      const uniqueInstructors = new Set<string>()

      for (const course of (coursesData || [])) {
        // totalStudents += course.student_count || 0 // YA NO USAMOS ESTE CONTADOR

        if (course.duration_total_minutes && course.duration_total_minutes > 0) {
          totalDuration += course.duration_total_minutes
          coursesWithDuration++
        }

        if (course.instructor_id) {
          uniqueInstructors.add(course.instructor_id)
        }
      }

      // Sumar estudiantes reales (Active Enrollments)
      // Nota: Esto asume que assignmentsData ahora trae user_course_enrollments
      totalStudents = assignmentsData?.length || 0;

      const averageDuration = coursesWithDuration > 0
        ? Math.round(totalDuration / coursesWithDuration)
        : 0

      return {
        totalWorkshops: totalWorkshops || 0,
        activeWorkshops: activeWorkshops || 0,
        totalStudents,
        averageDuration,
        totalInstructors: uniqueInstructors.size
      }
    } catch (error) {
      throw error
    }
  }

  static async getInstructors(): Promise<Array<{ id: string, name: string }>> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, display_name, first_name, last_name')
        .in('cargo_rol', ['Instructor', 'Administrador'])
        .order('display_name')

      if (error) {
        throw error
      }

      return (data || []).map((user: { id: string; display_name: string | null; first_name: string | null; last_name: string | null }) => ({
        id: user.id,
        name: user.display_name ||
          `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
          'Instructor sin nombre'
      }))
    } catch (error) {
      throw error
    }
  }
}
