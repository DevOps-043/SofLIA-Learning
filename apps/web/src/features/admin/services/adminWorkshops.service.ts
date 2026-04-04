import { createClient } from '../../../lib/supabase/server'
import { sanitizeSlug, generateUniqueSlugAsync } from '../../../lib/slug'
import { AuditLogService } from './auditLog.service'

export interface AdminWorkshop {
  id: string
  title: string
  description: string
  category: string
  level: string // Cambiado de 'difficulty' a 'level'
  duration_total_minutes: number // Cambiado de 'duration' a 'duration_total_minutes'
  instructor_id: string
  instructor_name?: string
  instructor_profile_picture_url?: string | null
  is_active: boolean // Cambiado de 'status' a 'is_active'
  thumbnail_url?: string // Cambiado de 'image_url' a 'thumbnail_url'
  slug: string
  price?: number
  average_rating?: number
  student_count: number // Cambiado de 'current_students' a 'student_count'
  review_count: number
  learning_objectives?: string[] | null
  approval_status?: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface WorkshopStats {
  totalWorkshops: number
  activeWorkshops: number
  totalStudents: number
  averageDuration: number
  totalInstructors: number
}

export class AdminWorkshopsService {
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

  static async createWorkshop(workshopData: Partial<AdminWorkshop>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminWorkshop> {

    const supabase = await createClient()

    try {
      // ✅ SEGURIDAD: Sanitizar y generar slug único
      let slug: string;

      if (workshopData.slug) {
        slug = sanitizeSlug(workshopData.slug);
      } else if (workshopData.title) {
        slug = sanitizeSlug(workshopData.title);
      } else {
        throw new Error('Se requiere título o slug para crear el taller');
      }

      // Verificar unicidad
      slug = await generateUniqueSlugAsync(slug, async (testSlug) => {
        const { data } = await supabase
          .from('courses')
          .select('slug')
          .eq('slug', testSlug)
          .single();
        return !!data;
      });

      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: workshopData.title,
          description: workshopData.description,
          category: workshopData.category,
          level: workshopData.level,
          duration_total_minutes: workshopData.duration_total_minutes,
          instructor_id: workshopData.instructor_id,
          is_active: workshopData.is_active || false,
          thumbnail_url: workshopData.thumbnail_url,
          slug,
          price: workshopData.price,
          average_rating: 0,
          student_count: 0,
          review_count: 0,
          learning_objectives: workshopData.learning_objectives,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
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
          created_at,
          updated_at
        `)
        .single()

      if (error) {
        console.error('[AdminWorkshopsService.createWorkshop] ❌ Error creando curso en BD:', error);
        throw error
      }

      // Registrar en el log de auditoría

      await AuditLogService.logAction({
        user_id: adminUserId, // En este caso, el admin es quien crea
        admin_user_id: adminUserId,
        action: 'CREATE',
        table_name: 'courses',
        record_id: data.id,
        old_values: undefined,
        new_values: workshopData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      // Traducir automáticamente el curso a inglés y portugués
      // IMPORTANTE: Esta operación debe completarse ANTES de devolver la respuesta
      // para evitar que se interrumpa cuando la página se refresca

      // EJECUTAR TRADUCCIÓN DE FORMA SÍNCRONA - NO CONTINUAR HASTA QUE TERMINE

      try {

        const translationModule = await import('../../../core/services/courseTranslation.service');
        const { translateCourseOnCreate } = translationModule;

        const courseDataForTranslation = {
          title: data.title || '',
          description: data.description || null,
          learning_objectives: data.learning_objectives || null
        };

        // AWAIT aquí es crítico: debe completarse antes de devolver la respuesta
        const translationResult = await translateCourseOnCreate(
          data.id,
          courseDataForTranslation,
          adminUserId,
          supabase // Pasar el cliente de Supabase existente
        );


        if (!translationResult.success) {
          console.error('[AdminWorkshopsService] ❌ La traducción NO fue exitosa');
          console.error('[AdminWorkshopsService] Errores:', translationResult.errors);
        } else {

        }

      } catch (translationError) {
        // No fallar la creación del curso si falla la traducción
        console.error('[AdminWorkshopsService] ========== ERROR EN TRADUCCIÓN ==========');
        console.error('[AdminWorkshopsService] ❌ EXCEPCIÓN en traducción automática del curso');
        console.error('[AdminWorkshopsService] Tipo de error:', translationError?.constructor?.name || typeof translationError);
        if (translationError instanceof Error) {
          console.error('[AdminWorkshopsService] Mensaje:', translationError.message);
          console.error('[AdminWorkshopsService] Stack trace:', translationError.stack);
        } else {
          console.error('[AdminWorkshopsService] Error (no es instancia de Error):', JSON.stringify(translationError, null, 2));
        }
        // No lanzar el error para que la creación del curso se complete exitosamente
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async updateWorkshop(workshopId: string, workshopData: Partial<AdminWorkshop>, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<AdminWorkshop> {
    const supabase = await createClient()

    try {
      // Obtener datos anteriores para el log de auditoría
      const { data: oldData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', workshopId)
        .single()

      // Preparar datos de actualización
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      }

      // Campos básicos
      if (workshopData.title !== undefined) updateData.title = workshopData.title
      if (workshopData.description !== undefined) updateData.description = workshopData.description
      if (workshopData.category !== undefined) updateData.category = workshopData.category
      if (workshopData.level !== undefined) updateData.level = workshopData.level
      if (workshopData.duration_total_minutes !== undefined) updateData.duration_total_minutes = workshopData.duration_total_minutes
      if (workshopData.instructor_id !== undefined) updateData.instructor_id = workshopData.instructor_id
      if (workshopData.is_active !== undefined) updateData.is_active = workshopData.is_active
      if (workshopData.thumbnail_url !== undefined) updateData.thumbnail_url = workshopData.thumbnail_url
      if (workshopData.slug !== undefined) updateData.slug = workshopData.slug
      if (workshopData.price !== undefined) updateData.price = workshopData.price
      if (workshopData.learning_objectives !== undefined) updateData.learning_objectives = workshopData.learning_objectives

      // Campos de aprobación
      if (workshopData.approval_status !== undefined) {
        updateData.approval_status = workshopData.approval_status

        // Si se aprueba, establecer approved_by y approved_at
        if (workshopData.approval_status === 'approved') {
          updateData.approved_by = adminUserId
          updateData.approved_at = new Date().toISOString()
          updateData.rejection_reason = null // Limpiar razón de rechazo si se aprueba
        }

        // Si se rechaza, limpiar approved_by y approved_at
        if (workshopData.approval_status === 'rejected') {
          updateData.approved_by = null
          updateData.approved_at = null
        }

        // Si vuelve a pending, limpiar todo
        if (workshopData.approval_status === 'pending') {
          updateData.approved_by = null
          updateData.approved_at = null
          updateData.rejection_reason = null
        }
      }

      if (workshopData.rejection_reason !== undefined) {
        updateData.rejection_reason = workshopData.rejection_reason
      }

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', workshopId)
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
        .single()

      if (error) {
        throw error
      }

      // Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'UPDATE',
        table_name: 'courses',
        record_id: workshopId,
        old_values: oldData,
        new_values: workshopData,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })

      return data
    } catch (error) {
      throw error
    }
  }

  static async deleteWorkshop(workshopId: string, adminUserId: string, requestInfo?: { ip?: string, userAgent?: string }): Promise<void> {
    const supabase = await createClient()

    try {
      // 1. Obtener datos del taller antes de eliminarlo para el log de auditoría
      const { data: workshopData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', workshopId)
        .single()

      if (!workshopData) {
        throw new Error('Taller no encontrado')
      }

      // 2. Obtener todos los módulos del curso
      const { data: modules } = await supabase
        .from('course_modules')
        .select('module_id')
        .eq('course_id', workshopId)

      const moduleIds = modules?.map((m: { module_id: string }) => m.module_id) || []

      if (moduleIds.length > 0) {
        // 3. Obtener todas las lecciones de estos módulos
        const { data: lessons } = await supabase
          .from('course_lessons')
          .select('lesson_id')
          .in('module_id', moduleIds)

        const lessonIds = lessons?.map((l: { lesson_id: string }) => l.lesson_id) || []

        if (lessonIds.length > 0) {
          // 4. ELIMINAR DEPENDENCIAS DE LECCIONES
          // Usamos Promise.all para ejecutar en paralelo, ignorando errores si no hay registros
          await Promise.all([
            supabase.from('lesson_materials').delete().in('lesson_id', lessonIds),
            supabase.from('lesson_activities').delete().in('lesson_id', lessonIds),
            supabase.from('lesson_checkpoints').delete().in('lesson_id', lessonIds),
            supabase.from('lesson_feedback').delete().in('lesson_id', lessonIds),
            supabase.from('lesson_time_estimates').delete().in('lesson_id', lessonIds),
            supabase.from('lesson_tracking').delete().in('lesson_id', lessonIds),
            // Eliminar preguntas comunes de LIA asociadas a lecciones
            supabase.from('lia_common_questions').delete().in('lesson_id', lessonIds),
            // Eliminar conversaciones de LIA asociadas a lecciones
            supabase.from('lia_conversations').delete().in('lesson_id', lessonIds),
            // Eliminar progreso de usuario
            supabase.from('user_lesson_progress').delete().in('lesson_id', lessonIds)
          ])

          // 5. Eliminar las lecciones
          const { error: deleteLessonsError } = await supabase
            .from('course_lessons')
            .delete()
            .in('lesson_id', lessonIds)

          if (deleteLessonsError) throw deleteLessonsError
        }

        // 6. Eliminar conversaciones de LIA asociadas a módulos (si las hay, aunque suelen estar ligadas a lecciones)
        await supabase.from('lia_conversations').delete().in('module_id', moduleIds)
        // Eliminar progreso de módulos
        await supabase.from('user_module_progress').delete().in('module_id', moduleIds)

        // 7. Eliminar los módulos
        const { error: deleteModulesError } = await supabase
          .from('course_modules')
          .delete()
          .in('module_id', moduleIds)

        if (deleteModulesError) throw deleteModulesError
      }

      // 8. ELIMINAR DEPENDENCIAS DIRECTAS DEL CURSO
      await Promise.all([
        supabase.from('course_skills').delete().eq('course_id', workshopId),
        supabase.from('course_reviews').delete().eq('course_id', workshopId),
        // Preguntas y respuestas del curso (foro)
        // Nota: course_question_responses tiene FK a course_questions, borrar preguntas debería borrar respuestas si hay cascade, 
        // pero por seguridad borramos respuestas primero si tienen course_id directo (cierto esquema lo tiene) o cascade manual.
        // El esquema muestra course_question_responses tiene course_id.
        supabase.from('course_question_responses').delete().eq('course_id', workshopId),
        supabase.from('course_questions').delete().eq('course_id', workshopId),

        supabase.from('hierarchy_course_assignments').delete().eq('course_id', workshopId),
        supabase.from('lia_conversations').delete().eq('course_id', workshopId),
        // Eliminar traducciones asociadas al curso
        supabase.from('content_translations').delete().eq('entity_id', workshopId).eq('entity_type', 'course'),
        // Eliminar progreso del curso
        supabase.from('user_course_progress').delete().eq('course_id', workshopId),
        
        // ✅ Nuevas dependencias de estudiantes agragadas para evitar el error de foreign key constraint
        supabase.from('organization_course_purchases').delete().eq('course_id', workshopId),
        supabase.from('organization_course_assignments').delete().eq('course_id', workshopId),
        supabase.from('user_course_enrollments').delete().eq('course_id', workshopId),
        supabase.from('user_course_certificates').delete().eq('course_id', workshopId),
        supabase.from('course_certificates').delete().eq('course_id', workshopId)
      ])

      // 9. Finalmente eliminar el taller
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', workshopId)

      if (error) {
        console.error('Error deleting workshop:', error)
        throw error
      }

      // 10. Registrar en el log de auditoría
      await AuditLogService.logAction({
        user_id: adminUserId,
        admin_user_id: adminUserId,
        action: 'DELETE',
        table_name: 'courses',
        record_id: workshopId,
        old_values: workshopData,
        new_values: undefined,
        ip_address: requestInfo?.ip,
        user_agent: requestInfo?.userAgent
      })
    } catch (error) {
      console.error('Error in AdminWorkshopsService.deleteWorkshop:', error)
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
