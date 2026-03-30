import { createClient } from '@/lib/supabase/server';

export interface PurchasedCourse {
  purchase_id: string;
  course_id: string;
  course_title: string;
  course_description: string;
  course_thumbnail: string;
  course_slug: string;
  course_category: string;
  instructor_name: string;
  access_status: 'active' | 'suspended' | 'expired' | 'cancelled';
  purchased_at: string;
  access_granted_at: string;
  expires_at?: string;
  enrollment_id: string;
  enrollment_status: string;
  progress_percentage: number;
  last_accessed_at: string;
  started_at: string;
  course_duration_minutes: number;
  estimated_duration?: number;
  difficulty?: string;
}

export class PurchasedCoursesService {
  /**
   * Obtiene todos los cursos comprados por el usuario
   */
  static async getUserPurchasedCourses(userId: string): Promise<PurchasedCourse[]> {
    try {
      const supabase = await createClient();

      // ✅ OPTIMIZACIÓN: Nested JOIN para incluir instructor en la misma query
      // ANTES: 2 consultas (compras+cursos, instructores batch)
      // DESPUÉS: 1 query total con nested JOIN
      const { data, error } = await supabase
        .from('course_purchases')
        .select(`
          purchase_id,
          access_status,
          purchased_at,
          access_granted_at,
          expires_at,
          enrollment_id,
          courses!inner (
            id,
            title,
            description,
            thumbnail_url,
            slug,
            category,
            duration_total_minutes,
            level,
            instructor_id,
            instructor:users!instructor_id (
              id,
              first_name,
              last_name,
              username
            )
          ),
          user_course_enrollments (
            enrollment_status,
            overall_progress_percentage,
            last_accessed_at,
            started_at
          )
        `)
        .eq('user_id', userId)
        .eq('access_status', 'active')
        .order('purchased_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Transformar los datos al formato esperado
      const purchasedCourses: PurchasedCourse[] = (data || []).map((purchase: any) => {
        const course = purchase.courses;
        const enrollment = purchase.user_course_enrollments?.[0] || {};

        // ✅ Instructor info ya viene del nested JOIN
        const instructor = course.instructor;
        const instructorName = instructor
          ? `${instructor.first_name || ''} ${instructor.last_name || ''}`.trim() || instructor.username || 'Instructor'
          : 'Instructor';

        return {
          purchase_id: purchase.purchase_id,
          course_id: course.id,
          course_title: course.title,
          course_description: course.description || '',
          course_thumbnail: course.thumbnail_url || '',
          course_slug: course.slug,
          course_category: course.category,
          instructor_name: instructorName,
          access_status: purchase.access_status,
          purchased_at: purchase.purchased_at,
          access_granted_at: purchase.access_granted_at,
          expires_at: purchase.expires_at,
          enrollment_id: purchase.enrollment_id || '',
          enrollment_status: enrollment.enrollment_status || 'active',
          progress_percentage: enrollment.overall_progress_percentage || 0,
          last_accessed_at: enrollment.last_accessed_at || purchase.purchased_at,
          started_at: enrollment.started_at || purchase.purchased_at,
          course_duration_minutes: course.duration_total_minutes || 0,
          estimated_duration: course.duration_total_minutes || 0,
          difficulty: course.level || 'beginner'
        };
      });

      return purchasedCourses;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica si un usuario ha comprado un curso específico
   */
  static async isCoursePurchased(userId: string, courseId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('course_purchases')
        .select('purchase_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('access_status', 'active')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        return false;
      }

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene estadísticas del usuario
   */
  static async getUserLearningStats(userId: string): Promise<{
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
    total_time_minutes: number;
    average_progress: number;
  }> {
    try {
      const supabase = await createClient();
      
      // Obtener todos los cursos comprados
      const { data: purchases, error: purchasesError } = await supabase
        .from('course_purchases')
        .select(`
          purchase_id,
          enrollment_id,
          course_id,
          courses!inner (
            id,
            duration_total_minutes
          )
        `)
        .eq('user_id', userId)
        .eq('access_status', 'active');

      if (purchasesError) {
        throw purchasesError;
      }

      if (!purchases || purchases.length === 0) {
        return {
          total_courses: 0,
          completed_courses: 0,
          in_progress_courses: 0,
          total_time_minutes: 0,
          average_progress: 0
        };
      }

      // Obtener los course_ids de los purchases para buscar enrollments
      const courseIds = purchases
        .map((p: any) => p.course_id)
        .filter((id: string | null) => id !== null && id !== undefined);

      // Obtener todos los enrollments del usuario para los cursos comprados
      // Esto asegura que encontremos enrollments incluso si el purchase no tiene enrollment_id
      let enrollmentsMap = new Map();
      if (courseIds.length > 0) {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('user_course_enrollments')
          .select('enrollment_id, enrollment_status, overall_progress_percentage, course_id')
          .eq('user_id', userId)
          .in('course_id', courseIds);

        if (enrollmentsError) {
          throw enrollmentsError;
        }

        // Crear un mapa usando course_id como clave para acceso rápido
        // Si hay múltiples enrollments para el mismo curso, usamos el más reciente
        if (enrollments) {
          enrollments.forEach((enrollment: any) => {
            const existing = enrollmentsMap.get(enrollment.course_id);
            // Si ya existe uno, mantener el que tenga mayor progreso o sea 'completed'
            if (!existing || 
                enrollment.enrollment_status === 'completed' ||
                (Number(enrollment.overall_progress_percentage) > Number(existing.overall_progress_percentage))) {
              enrollmentsMap.set(enrollment.course_id, enrollment);
            }
          });
        }
      }

      let completed_courses = 0;
      let in_progress_courses = 0;
      let total_progress = 0;
      let total_time = 0;
      let enrollments_with_progress = 0;

      purchases.forEach((purchase: any) => {
        const course = purchase.courses;
        
        if (course) {
          total_time += course.duration_total_minutes || 0;
        }

        // Buscar el enrollment usando el course_id (más confiable que enrollment_id)
        const enrollment = course?.id 
          ? enrollmentsMap.get(course.id)
          : null;

        if (enrollment) {
          const status = enrollment.enrollment_status;
          const progress = Number(enrollment.overall_progress_percentage) || 0;
          
          enrollments_with_progress++;
          
          // Un curso está completado si:
          // 1. El enrollment_status es 'completed', O
          // 2. El overall_progress_percentage es >= 100
          const isCompleted = status === 'completed' || progress >= 100;
          
          // Un curso está en progreso si:
          // 1. Tiene progreso > 0 y < 100, Y
          // 2. No está completado, Y
          // 3. No está cancelado ni pausado
          const isInProgress = progress > 0 && progress < 100 && !isCompleted && status !== 'cancelled' && status !== 'paused';
          
          if (isCompleted) {
            completed_courses++;
          } else if (isInProgress) {
            in_progress_courses++;
          }
          
          total_progress += progress;
        }
      });

      return {
        total_courses: purchases.length,
        completed_courses,
        in_progress_courses,
        total_time_minutes: total_time,
        average_progress: enrollments_with_progress > 0 ? total_progress / enrollments_with_progress : 0
      };
    } catch (error) {
      throw error;
    }
  }
}

