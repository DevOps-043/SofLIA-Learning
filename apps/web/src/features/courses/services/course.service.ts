import 'server-only'
import { createClient } from '../../../lib/supabase/server'
import { createAdminClient } from '../../../lib/supabase/admin'
import { fromLoose } from '../../../lib/supabase/looseQuery'
import {
  type CourseQueryRow,
  type CourseWithInstructor,
  type FavoriteQueryRow,
  type PurchaseQueryRow,
  extractFavoriteCourseIds,
  extractPurchasedCourseIds,
  mapCourseRowToCourse,
} from './course.service.utils'

async function attachPublicInstructors(
  courses: CourseQueryRow[],
): Promise<CourseQueryRow[]> {
  const instructorIds = [
    ...new Set(
      courses
        .map((course) => course.instructor_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  if (instructorIds.length === 0) return courses

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('id, first_name, last_name, username')
    .in('id', instructorIds)

  if (error) {
    throw new Error(`Error al obtener instructores publicos: ${error.message}`)
  }

  const instructorsById = new Map(
    (data || []).map((instructor) => [instructor.id, instructor]),
  )

  return courses.map((course) => ({
    ...course,
    instructor: course.instructor_id
      ? instructorsById.get(course.instructor_id) || null
      : null,
  }))
}

export interface CourseFilters {
  category?: string
  userId?: string
}

export class CourseService {
  /**
   * Obtiene todos los cursos activos de la base de datos
   */
  static async getActiveCourses(userId?: string): Promise<CourseWithInstructor[]> {
    const supabase = await createClient()

    const coursesQuery = supabase
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
          updated_at
        `)
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false })

    const [
      coursesResult,
      favoritesResult,
      purchasesResult,
    ] = await Promise.all([
      coursesQuery,
      userId
        ? fromLoose<FavoriteQueryRow>(supabase, 'user_favorites')
            .select('course_id')
            .eq('user_id', userId)
        : Promise.resolve(null),
      userId
        ? fromLoose<PurchaseQueryRow>(supabase, 'course_purchases')
            .select('course_id, access_status')
            .eq('user_id', userId)
        : Promise.resolve(null),
    ])

    if (coursesResult.error) {
      throw new Error(`Error al obtener cursos: ${coursesResult.error.message}`)
    }

    const userFavorites = extractFavoriteCourseIds(favoritesResult)
    const purchasedCourseIds = extractPurchasedCourseIds(purchasesResult)

    const publicCourses = await attachPublicInstructors(coursesResult.data || [])

    return publicCourses.map((course) => {
      const isPurchased = purchasedCourseIds.includes(course.id)

      return mapCourseRowToCourse(course, {
        isFavorite: userFavorites.includes(course.id),
        status: isPurchased ? 'Adquirido' : 'Disponible',
      })
    })
  }

  /**
   * Obtiene un curso especÃ­fico por slug
   */
  static async getCourseBySlug(slug: string, userId?: string): Promise<CourseWithInstructor | null> {
    const supabase = await createClient()

    const courseQuery = supabase
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
          updated_at
        `)
      .eq('slug', slug)
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .single()

    const [courseResult, favoritesResult] = await Promise.all([
      courseQuery,
      userId
        ? fromLoose<FavoriteQueryRow>(supabase, 'user_favorites')
            .select('course_id')
            .eq('user_id', userId)
        : Promise.resolve(null),
    ])

    if (courseResult.error || !courseResult.data) {
      return null
    }

    const userFavorites = extractFavoriteCourseIds(favoritesResult)

    const [publicCourse] = await attachPublicInstructors([courseResult.data])

    return mapCourseRowToCourse(publicCourse, {
      isFavorite: userFavorites.includes(courseResult.data.id),
      status: 'Disponible',
    })
  }

  /**
   * Obtiene un curso especÃ­fico por ID
   */
  static async getCourseById(courseId: string): Promise<CourseWithInstructor | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
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
          created_at,
          updated_at
        `)
      .eq('id', courseId)
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .single()

    if (error || !data) {
      return null
    }

    return mapCourseRowToCourse(data, {
      status: 'Disponible',
    })
  }

  /**
   * Obtiene todas las categorÃ­as Ãºnicas de los cursos activos
   */
  static async getCategories(): Promise<string[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('courses')
      .select('category')
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .not('category', 'is', null)

    if (error) {
      throw new Error(`Error al obtener categorÃ­as: ${error.message}`)
    }

    return [...new Set((data || []).map((course) => course.category))]
      .filter((category): category is string => Boolean(category && category.trim() !== ''))
      .sort()
  }

  /**
   * Obtiene cursos por categorÃ­a
   */
  static async getCoursesByCategory(category: string): Promise<CourseWithInstructor[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
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
          updated_at
        `)
      .eq('is_active', true)
      .eq('approval_status', 'approved')
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error al obtener cursos por categorÃ­a: ${error.message}`)
    }

    const publicCourses = await attachPublicInstructors(data || [])

    return publicCourses.map((course) =>
      mapCourseRowToCourse(course, {
        status: 'Disponible',
      }),
    )
  }
}

export type { CourseWithInstructor } from './course.service.utils'
