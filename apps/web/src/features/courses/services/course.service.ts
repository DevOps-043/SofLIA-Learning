import { createClient } from '../../../lib/supabase/server'
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
          updated_at,
          instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            email,
            username
          )
        `)
      .eq('is_active', true)
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

    return (coursesResult.data || []).map((course) => {
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
          updated_at,
          instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            email,
            username
          )
        `)
      .eq('slug', slug)
      .eq('is_active', true)
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

    return mapCourseRowToCourse(courseResult.data, {
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
          updated_at,
          instructor:users!instructor_id (
            id,
            first_name,
            last_name,
            email,
            username
          )
        `)
      .eq('is_active', true)
      .eq('category', category)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error al obtener cursos por categorÃ­a: ${error.message}`)
    }

    return (data || []).map((course) =>
      mapCourseRowToCourse(course, {
        status: 'Disponible',
      }),
    )
  }
}

export type { CourseWithInstructor } from './course.service.utils'
