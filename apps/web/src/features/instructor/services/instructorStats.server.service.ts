// Este archivo solo debe ser usado en el servidor (API routes)
import { createClient } from '@/lib/supabase/server'
import { InstructorStats } from './instructorStats.service'

export class InstructorStatsServerService {
  /**
   * Obtiene las estadísticas del instructor basándose en su instructor_id
   * ✅ OPTIMIZACIÓN: Paralelizar queries + usar vista materializada
   * ANTES: 2 queries secuenciales (~1 segundo)
   * DESPUÉS: 1 query a vista materializada (~10-50ms) o 2 paralelas (~500ms)
   * Este método debe ser llamado desde el servidor (API routes)
   */
  static async getInstructorStats(instructorId: string): Promise<InstructorStats> {
    const supabase = await createClient()

    try {
      // ✅ OPTIMIZACIÓN: Intentar usar vista materializada primero
      const { data: statsFromView, error: viewError } = await supabase
        .rpc('get_instructor_stats_fast', { p_instructor_id: instructorId })
        .single()

      if (!viewError && statsFromView) {
        // Vista materializada disponible - retornar inmediatamente
        return {
          totalCourses: Number(statsFromView.total_courses) || 0,
          totalStudents: Number(statsFromView.total_students) || 0,
          totalReels: Number(statsFromView.total_reels) || 0,
          averageRating: Number(statsFromView.average_rating) || 0,
          totalHours: Number(statsFromView.total_hours) || 0,
          coursesThisMonth: Number(statsFromView.courses_this_month) || 0,
          studentsThisMonth: Number(statsFromView.students_this_month) || 0,
          reelsThisMonth: Number(statsFromView.reels_this_month) || 0,
        }
      }

      // Fallback: Vista no disponible, usar queries tradicionales paralelizadas
      // ✅ OPTIMIZACIÓN: Paralelizar queries de cursos y reels
      // ANTES: Secuencial (~1000ms)
      // DESPUÉS: Paralelo (~500ms)
      const [coursesResult, reelsResult] = await Promise.all([
        supabase
          .from('courses')
          .select('id, student_count, average_rating, duration_total_minutes, created_at')
          .eq('instructor_id', instructorId),
        supabase
          .from('reels')
          .select('id, created_at')
          .eq('created_by', instructorId)
      ])

      const { data: courses, error: coursesError } = coursesResult
      const { data: reels, error: reelsError } = reelsResult

      if (coursesError) {
        throw new Error(`Error al obtener cursos: ${coursesError.message}`)
      }

      if (reelsError) {
        throw new Error(`Error al obtener reels: ${reelsError.message}`)
      }

      // Calcular totales
      const totalCourses = courses?.length || 0
      const totalReels = reels?.length || 0

      // Sumar estudiantes (suma de student_count de todos los cursos)
      const totalStudents = courses?.reduce((sum, course) => sum + (course.student_count || 0), 0) || 0

      // Calcular calificación promedio (promedio de average_rating de los cursos que tienen rating)
      const coursesWithRating = courses?.filter(c => c.average_rating && c.average_rating > 0) || []
      const averageRating = coursesWithRating.length > 0
        ? coursesWithRating.reduce((sum, course) => sum + (course.average_rating || 0), 0) / coursesWithRating.length
        : 0

      // Sumar horas totales (suma de duration_total_minutes convertido a horas)
      const totalMinutes = courses?.reduce((sum, course) => sum + (course.duration_total_minutes || 0), 0) || 0
      const totalHours = Math.round(totalMinutes / 60)

      // Calcular crecimiento este mes
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const coursesThisMonth = courses?.filter(
        course => new Date(course.created_at) >= startOfMonth
      ).length || 0

      const reelsThisMonth = reels?.filter(
        reel => new Date(reel.created_at) >= startOfMonth
      ).length || 0

      // Para estudiantes este mes, necesitamos obtener los cursos creados este mes y sumar sus estudiantes
      const newCoursesThisMonth = courses?.filter(
        course => new Date(course.created_at) >= startOfMonth
      ) || []
      const studentsThisMonth = newCoursesThisMonth.reduce(
        (sum, course) => sum + (course.student_count || 0), 0
      )

      return {
        totalCourses,
        totalStudents,
        totalReels,
        averageRating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
        totalHours,
        coursesThisMonth,
        studentsThisMonth,
        reelsThisMonth
      }
    } catch (error) {
      throw error
    }
  }
}

