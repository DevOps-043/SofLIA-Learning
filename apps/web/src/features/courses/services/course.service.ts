import { createClient } from '../../../lib/supabase/server'
import { Course } from '@aprende-y-aplica/shared'

export interface CourseWithInstructor extends Course {
  instructor_id?: string;
  instructor_name?: string;
  instructor_email?: string;
  category?: string;
  slug?: string;
  rating?: number;
  price?: string;
  status?: 'Adquirido' | 'Disponible';
  isFavorite?: boolean;
  student_count?: number;
  review_count?: number;
  learning_objectives?: string[];
}

export interface CourseFilters {
  category?: string;
  userId?: string; // Para obtener favoritos del usuario
}

export class CourseService {
  /**
   * Obtiene todos los cursos activos de la base de datos
   */
  static async getActiveCourses(userId?: string): Promise<CourseWithInstructor[]> {
    try {
      const supabase = await createClient()

      // ✅ OPTIMIZACIÓN: Separar consultas independientes para paralelización
      // Consulta principal de cursos + consultas de usuario en paralelo

      // Construir consulta principal con JOIN de instructores
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

      // ✅ OPTIMIZACIÓN: Paralelizar consultas independientes (cursos, favoritos, compras)
      // ANTES: 4-5 consultas secuenciales (~2-3 segundos)
      // DESPUÉS: 3 consultas paralelas (~500-800ms)

      const queries = [coursesQuery]

      // Si hay userId, agregar consultas de favoritos y compras en paralelo
      if (userId) {
        queries.push(
          supabase
            .from('user_favorites')
            .select('course_id')
            .eq('user_id', userId),
          supabase
            .from('course_purchases')
            .select('course_id, access_status')
            .eq('user_id', userId)
        )
      }

      const results = await Promise.all(queries)

      const { data, error } = results[0] as any
      if (error) {
        throw new Error(`Error al obtener cursos: ${error.message}`)
      }

      // Procesar favoritos
      let userFavorites: string[] = []
      if (userId && results.length > 1) {
        const favoritesResult = results[1] as any
        if (favoritesResult.data && !favoritesResult.error) {
          userFavorites = favoritesResult.data.map((f: any) => f.course_id)
        }
      }

      // Procesar compras
      let purchasedCourseIds: string[] = []
      if (userId && results.length > 2) {
        const purchasesResult = results[2] as any
        if (purchasesResult.data && !purchasesResult.error) {
          purchasedCourseIds = purchasesResult.data
            .filter((p: any) => p.access_status === 'active')
            .map((p: any) => p.course_id)

          // Si no hay compras activas, incluir todas
          if (purchasedCourseIds.length === 0) {
            purchasedCourseIds = purchasesResult.data.map((p: any) => p.course_id)
          }

        }
      }

      // Transformar los datos de la base de datos al formato esperado por el frontend
      const courses: CourseWithInstructor[] = data.map((course: any) => {
        // ✅ Instructor info ya viene del JOIN, no necesitamos queries adicionales
        const instructor = course.instructor
        const instructorInfo = instructor
          ? {
              name: `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.username || 'Instructor',
              email: instructor.email || 'instructor@example.com'
            }
          : {
              name: 'Instructor',
              email: 'instructor@example.com'
            }

        // Verificar si el curso está comprado
        const isPurchased = purchasedCourseIds.includes(course.id)

        // Debug: Log para verificar el status
        if (isPurchased) {
        }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail_url,
          status: 'published' as any, // Mapear is_active a status
          estimatedDuration: course.duration_total_minutes,
          difficulty: course.level as any, // Mapear level a difficulty
          isPublic: course.is_active,
          createdAt: new Date(course.created_at),
          updatedAt: new Date(course.updated_at),
          modules: [], // Los módulos se cargarán por separado si es necesario
          category: course.category,
          instructor_id: course.instructor_id,
          slug: course.slug,
          // Datos reales de la base de datos
          rating: course.average_rating || 0,
          price: course.price ? `MX$${course.price.toFixed(0)}` : 'MX$0',
          // IMPORTANTE: El status debe ser 'Adquirido' o 'Disponible'
          status: isPurchased ? ('Adquirido' as 'Adquirido' | 'Disponible') : ('Disponible' as 'Adquirido' | 'Disponible'),
          isFavorite: userFavorites.includes(course.id),
          instructor_name: instructorInfo.name,
          instructor_email: instructorInfo.email,
          student_count: course.student_count || 0,
          review_count: course.review_count || 0,
          learning_objectives: course.learning_objectives || [],
        }
      })

      return courses
    } catch (error) {
      throw error
    }
  }

  /**
   * Obtiene un curso específico por slug
   */
  static async getCourseBySlug(slug: string, userId?: string): Promise<CourseWithInstructor | null> {
    try {
      const supabase = await createClient()

      // ✅ OPTIMIZACIÓN: JOIN para instructor + paralelización de favoritos
      // ANTES: 3 consultas secuenciales
      // DESPUÉS: 2 consultas paralelas (curso+instructor, favoritos)

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

      const queries = [courseQuery]

      // Si hay userId, agregar query de favoritos en paralelo
      if (userId) {
        queries.push(
          supabase
            .from('user_favorites')
            .select('course_id')
            .eq('user_id', userId)
        )
      }

      const results = await Promise.all(queries)
      const { data, error } = results[0] as any

      if (error) {
        return null
      }

      // Procesar favoritos
      let userFavorites: string[] = []
      if (userId && results.length > 1) {
        const favoritesResult = results[1] as any
        if (favoritesResult.data && !favoritesResult.error) {
          userFavorites = favoritesResult.data.map((f: any) => f.course_id)
        }
      }

      // Transformar los datos
      const instructor = data.instructor
      const instructorInfo = instructor
        ? {
            name: `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.username || 'Instructor',
            email: instructor.email || 'instructor@example.com'
          }
        : {
            name: 'Instructor',
            email: 'instructor@example.com'
          }

      const course: CourseWithInstructor = {
        id: data.id,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail_url,
        status: 'published' as any,
        estimatedDuration: data.duration_total_minutes,
        difficulty: data.level as any,
        isPublic: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        modules: [],
        category: data.category,
        instructor_id: data.instructor_id,
        slug: data.slug,
        rating: data.average_rating || 0,
        price: data.price ? `MX$${data.price.toFixed(0)}` : 'MX$0',
        status: 'Disponible',
        isFavorite: userFavorites.includes(data.id),
        instructor_name: instructorInfo.name,
        instructor_email: instructorInfo.email,
        // Datos adicionales de la base de datos
        student_count: data.student_count || 0,
        review_count: data.review_count || 0,
        learning_objectives: data.learning_objectives || [],
      }

      return course
    } catch (error) {
      return null
    }
  }

  /**
   * Obtiene un curso específico por ID
   */
  static async getCourseById(courseId: string): Promise<CourseWithInstructor | null> {
    try {
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

      if (error) {
        return null
      }

      // Transformar los datos
      const course: CourseWithInstructor = {
        id: data.id,
        title: data.title,
        description: data.description,
        thumbnail: data.thumbnail_url,
        status: 'published' as any,
        estimatedDuration: data.duration_total_minutes,
        difficulty: data.level as any,
        isPublic: data.is_active,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        modules: [],
        category: data.category,
        instructor_id: data.instructor_id,
        slug: data.slug,
        rating: 4.5,
        price: 'MX$0',
        status: 'Disponible',
        isFavorite: false,
      }

      return course
    } catch (error) {
      return null
    }
  }

  /**
   * Obtiene todas las categorías únicas de los cursos activos
   */
  static async getCategories(): Promise<string[]> {
    try {
      const supabase = await createClient()
      
      const { data, error } = await supabase
        .from('courses')
        .select('category')
        .eq('is_active', true)
        .not('category', 'is', null)

      if (error) {
        throw new Error(`Error al obtener categorías: ${error.message}`)
      }

      // Obtener categorías únicas y ordenarlas
      const uniqueCategories = [...new Set(data.map(course => course.category))]
        .filter(category => category && category.trim() !== '')
        .sort()

      return uniqueCategories
    } catch (error) {
      throw error
    }
  }

  /**
   * Obtiene cursos por categoría
   */
  static async getCoursesByCategory(category: string): Promise<CourseWithInstructor[]> {
    try {
      const supabase = await createClient()

      // ✅ OPTIMIZACIÓN: JOIN para instructor en la misma query
      // ANTES: 2 consultas (cursos + instructores batch)
      // DESPUÉS: 1 query total
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
        throw new Error(`Error al obtener cursos por categoría: ${error.message}`)
      }

      // Transformar los datos
      const courses: CourseWithInstructor[] = data.map((course: any) => {
        const instructor = course.instructor
        const instructorInfo = instructor
          ? {
              name: `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.username || 'Instructor',
              email: instructor.email || 'instructor@example.com'
            }
          : {
              name: 'Instructor',
              email: 'instructor@example.com'
            }

        return {
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail_url,
          status: 'published' as any,
          estimatedDuration: course.duration_total_minutes,
          difficulty: course.level as any,
          isPublic: course.is_active,
          createdAt: new Date(course.created_at),
          updatedAt: new Date(course.updated_at),
          modules: [],
          category: course.category,
          instructor_id: course.instructor_id,
          slug: course.slug,
          rating: course.average_rating || 0,
          price: course.price ? `MX$${course.price.toFixed(0)}` : 'MX$0',
          status: 'Disponible',
          isFavorite: false,
          instructor_name: instructorInfo.name,
          instructor_email: instructorInfo.email,
          student_count: course.student_count || 0,
          review_count: course.review_count || 0,
          learning_objectives: course.learning_objectives || [],
        }
      })

      return courses
    } catch (error) {
      throw error
    }
  }
}

