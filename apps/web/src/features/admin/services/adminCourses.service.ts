import { createClient } from '../../../lib/supabase/server'

export interface AdminCourse {
  id: string
  title: string
  description: string
  slug: string
  category: string
  level: string
  instructor_id: string
  duration_total_minutes: number
  thumbnail_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
  price?: number
  average_rating?: number
  student_count: number
  review_count: number
  learning_objectives?: any
  // Campos calculados para mostrar
  instructor_name?: string
  duration_hours?: number
}

export class AdminCoursesService {
  static async getAllCourses(): Promise<AdminCourse[]> {
    const supabase = await createClient()

    try {
      // ✅ OPTIMIZACIÓN: Usar JOIN para obtener instructor en la misma query
      // ANTES: 1 + N queries (100 cursos = 101 queries)
      // DESPUÉS: 1 query total (99% menos queries)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          is_active,
          created_at,
          updated_at,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            display_name
          )
        `)
        .order('title', { ascending: true })

      if (error) {
        return []
      }


      // Mapear datos con instructor ya incluido
      const courses = (data || []).map((course: any) => {
        const instructor = course.instructor
        const instructorName = instructor
          ? (instructor.display_name ||
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor')
          : 'Instructor no encontrado'

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level,
          instructor_id: course.instructor_id,
          duration_total_minutes: course.duration_total_minutes,
          thumbnail_url: course.thumbnail_url,
          is_active: course.is_active,
          created_at: course.created_at,
          updated_at: course.updated_at,
          price: course.price,
          average_rating: course.average_rating,
          student_count: course.student_count,
          review_count: course.review_count,
          learning_objectives: course.learning_objectives,
          instructor_name: instructorName,
          duration_hours: Math.round(course.duration_total_minutes / 60 * 10) / 10,
        }
      })

      return courses
    } catch (error) {
      return []
    }
  }

  static async getActiveCourses(): Promise<AdminCourse[]> {
    const supabase = await createClient()

    try {
      // ✅ OPTIMIZACIÓN: Usar JOIN para obtener instructor en la misma query
      // ANTES: 1 + N queries (100 cursos = 101 queries)
      // DESPUÉS: 1 query total (99% menos queries)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          is_active,
          created_at,
          updated_at,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            display_name
          )
        `)
        .eq('is_active', true)
        .order('title', { ascending: true })

      if (error) {
        return []
      }


      // Mapear datos con instructor ya incluido
      const courses = (data || []).map((course: any) => {
        const instructor = course.instructor
        const instructorName = instructor
          ? (instructor.display_name ||
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor')
          : 'Instructor no encontrado'

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          slug: course.slug,
          category: course.category,
          level: course.level,
          instructor_id: course.instructor_id,
          duration_total_minutes: course.duration_total_minutes,
          thumbnail_url: course.thumbnail_url,
          is_active: course.is_active,
          created_at: course.created_at,
          updated_at: course.updated_at,
          price: course.price,
          average_rating: course.average_rating,
          student_count: course.student_count,
          review_count: course.review_count,
          learning_objectives: course.learning_objectives,
          instructor_name: instructorName,
          duration_hours: Math.round(course.duration_total_minutes / 60 * 10) / 10,
        }
      })

      return courses
    } catch (error) {
      return []
    }
  }

  // NUEVO: Obtener Cursos Pendientes de Aprobación
  static async getPendingCourses(): Promise<AdminCourse[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          id,
          title,
          description,
          slug,
          category,
          level,
          instructor_id,
          duration_total_minutes,
          thumbnail_url,
          is_active,
          created_at,
          updated_at,
          price,
          average_rating,
          student_count,
          review_count,
          learning_objectives,
          approval_status,
          instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            display_name
          )
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching pending courses:', error)
        return []
      }

      return (data || []).map((course: any) => {
        const instructor = course.instructor
        const instructorName = instructor
          ? (instructor.display_name ||
            `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
            'Instructor')
          : 'Instructor no encontrado'

        return {
          ...course,
          instructor_name: instructorName,
          duration_hours: Math.round(course.duration_total_minutes / 60 * 10) / 10,
        }
      })
    } catch (error) {
      console.error('Error in AdminCoursesService.getPendingCourses:', error)
      return []
    }
  }

  // NUEVO: Aprobar Curso
  static async approveCourse(courseId: string, adminId: string): Promise<boolean> {
    const supabase = await createClient()

    // 1. Actualizar curso
    const { error: courseError } = await supabase
      .from('courses')
      .update({
        approval_status: 'approved',
        is_active: true,
        approved_by: adminId,
        approved_at: new Date().toISOString()
      })
      .eq('id', courseId)

    if (courseError) {
      console.error('Error approving course:', courseError)
      return false
    }

    // 2. Activar Módulos y Lecciones (Opcional: podrías querer revisar qué módulos activar)
    // Por defecto, activamos todo
    await supabase.from('course_modules').update({ is_published: true }).eq('course_id', courseId)
    // Para lecciones, necesitamos un join o subquery, pero supabase-js no soporta update con join directo facilmente.
    // Lo ideal seria crear una funcion almacenada RPC 'activate_full_course', pero haremos un loop simple por ahora o una query anidada si fuera posible.
    // Aproximación segurá: Buscar todas las lecciones de los módulos de este curso.

    // Obtener ids de modulos
    const { data: modules } = await supabase.from('course_modules').select('module_id').eq('course_id', courseId)
    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.module_id)
      await supabase.from('course_lessons').update({ is_published: true }).in('module_id', moduleIds)
    }

    return true
  }

  // NUEVO: Rechazar Curso
  static async rejectCourse(courseId: string, reason: string): Promise<boolean> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('courses')
      .update({
        approval_status: 'rejected',
        rejection_reason: reason,
        is_active: false
      })
      .eq('id', courseId)

    return !error
  }

  // NUEVO: Obtener detalle completo del curso (Módulos -> Lecciones -> Materiales)
  static async getCourseFullDetails(courseId: string): Promise<any> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            display_name,
            profile_picture_url
        ),
        modules:course_modules (
          *,
          lessons:course_lessons (
            *,
            materials:lesson_materials (*)
          )
        )
      `)
      .eq('id', courseId)
      .single()

    if (error) {
      console.error('Error fetching course details:', error)
      return null
    }

    // Ordenar jerarquía
    if (data.modules) {
      data.modules.sort((a: any, b: any) => a.module_order_index - b.module_order_index)
      data.modules.forEach((mod: any) => {
        if (mod.lessons) {
          mod.lessons.sort((a: any, b: any) => a.lesson_order_index - b.lesson_order_index)
          mod.lessons.forEach((lesson: any) => {
            if (lesson.materials) {
              lesson.materials.sort((a: any, b: any) => a.material_order_index - b.material_order_index)
            }
          })
        }
      })
    }

    return data
  }
}
