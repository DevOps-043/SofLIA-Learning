import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../lib/supabase/server'
import type { Json, Tables } from '../../../lib/supabase/types'

interface CourseInstructor {
  id: string
  first_name: string | null
  last_name: string | null
  display_name: string | null
  profile_picture_url?: string | null
}

type CourseRow = Tables<'courses'> & {
  instructor?: CourseInstructor | null
}

interface MaterialRow { material_order_index: number }
interface LessonRow { lesson_order_index: number; materials?: MaterialRow[] }
interface ModuleRow { module_order_index: number; lessons?: LessonRow[] }

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
  learning_objectives?: string[] | null
  // Campos calculados para mostrar
  instructor_name?: string
  duration_hours?: number
}

function parseLearningObjectives(value: Json): string[] | null {
  if (!Array.isArray(value)) {
    return null
  }

  const objectives = value.filter((objective): objective is string => typeof objective === 'string')
  return objectives.length > 0 ? objectives : null
}

function getInstructorName(instructor?: CourseInstructor | null): string {
  return instructor
    ? (instructor.display_name ||
      `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() ||
      'Instructor')
    : 'Instructor no encontrado'
}

function mapAdminCourse(course: CourseRow): AdminCourse {
  const durationMinutes = course.duration_total_minutes ?? 0

  return {
    id: course.id,
    title: course.title,
    description: course.description ?? '',
    slug: course.slug,
    category: course.category,
    level: course.level,
    instructor_id: course.instructor_id ?? '',
    duration_total_minutes: durationMinutes,
    thumbnail_url: course.thumbnail_url ?? undefined,
    is_active: course.is_active ?? false,
    created_at: course.created_at ?? '',
    updated_at: course.updated_at ?? '',
    price: course.price ?? undefined,
    average_rating: course.average_rating ?? undefined,
    student_count: course.student_count ?? 0,
    review_count: course.review_count ?? 0,
    learning_objectives: parseLearningObjectives(course.learning_objectives),
    instructor_name: getInstructorName(course.instructor),
    duration_hours: Math.round(durationMinutes / 60 * 10) / 10,
  }
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
      const courses = ((data || []) as unknown as CourseRow[]).map(mapAdminCourse)

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
      const courses = ((data || []) as unknown as CourseRow[]).map(mapAdminCourse)

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
        techDebtLogger.error('Error fetching pending courses:', error)
        return []
      }

      return ((data || []) as unknown as CourseRow[]).map(mapAdminCourse)
    } catch (error) {
      techDebtLogger.error('Error in AdminCoursesService.getPendingCourses:', error)
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
      techDebtLogger.error('Error approving course:', courseError)
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
  static async getCourseFullDetails(courseId: string): Promise<CourseRow & { modules?: ModuleRow[] } | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('courses')
      .select(`
        id, title, description, slug, category, level, instructor_id,
        duration_total_minutes, thumbnail_url, is_active, created_at, updated_at,
        price, average_rating, student_count, review_count, learning_objectives,
        approval_status,
        instructor:users!instructor_id (
          id, first_name, last_name, display_name, profile_picture_url
        ),
        modules:course_modules (
          module_id, course_id, title, description, module_order_index,
          module_duration_minutes, is_published,
          lessons:course_lessons (
            lesson_id, module_id, title, description, lesson_order_index,
            lesson_type, duration_minutes, is_published, is_free,
            materials:lesson_materials (
              material_id, lesson_id, title, material_type, material_order_index, file_url
            )
          )
        )
      `)
      .eq('id', courseId)
      .single()

    if (error) {
      techDebtLogger.error('Error fetching course details:', error)
      return null
    }

    // Ordenar jerarquía
    const courseDetails = data as unknown as CourseRow & { modules?: ModuleRow[] }
    if (courseDetails.modules) {
      courseDetails.modules.sort((a: ModuleRow, b: ModuleRow) => a.module_order_index - b.module_order_index)
      courseDetails.modules.forEach((mod: ModuleRow) => {
        if (mod.lessons) {
          mod.lessons.sort((a: LessonRow, b: LessonRow) => a.lesson_order_index - b.lesson_order_index)
          mod.lessons.forEach((lesson: LessonRow) => {
            if (lesson.materials) {
              lesson.materials.sort((a: MaterialRow, b: MaterialRow) => a.material_order_index - b.material_order_index)
            }
          })
        }
      })
    }

    return courseDetails
  }
}
