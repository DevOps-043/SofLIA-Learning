import { createClient } from '../../../lib/supabase/server'

export interface AdminLesson {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  video_provider_id: string
  video_provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds: number
  total_duration_minutes: number // Tiempo total: video + materiales + actividades
  transcript_content: string | null
  summary_content: string | null
  is_published: boolean
  module_id: string
  instructor_id: string
  instructor_name?: string // Calculado
  created_at: string
  updated_at: string
}

export interface CreateLessonData {
  lesson_title: string
  lesson_description?: string
  video_provider_id: string
  video_provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds: number
  transcript_content?: string
  summary_content?: string
  is_published?: boolean
  instructor_id: string
}

export interface UpdateLessonData {
  lesson_title?: string
  lesson_description?: string
  video_provider_id?: string
  video_provider?: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds?: number
  transcript_content?: string
  summary_content?: string
  is_published?: boolean
  instructor_id?: string
}

export class AdminLessonsService {
  static async getModuleLessons(moduleId: string): Promise<AdminLesson[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select(`
          lesson_id,
          lesson_title,
          lesson_description,
          lesson_order_index,
          video_provider_id,
          video_provider,
          duration_seconds,
          total_duration_minutes,
          transcript_content,
          summary_content,
          is_published,
          module_id,
          instructor_id,
          created_at,
          updated_at
        `)
        .eq('module_id', moduleId)
        .order('lesson_order_index', { ascending: true })

      if (error) {
        // console.error('Error fetching lessons:', error)
        throw error
      }

      // Obtener nombres de instructores y reconstruir URLs de Supabase Storage
      const lessonsWithInstructors = await Promise.all(
        (data || []).map(async (lesson: any) => {
          let instructorName = 'Instructor no asignado'

          if (lesson.instructor_id) {
            const { data: instructor } = await supabase
              .from('users')
              .select('display_name, first_name, last_name')
              .eq('id', lesson.instructor_id)
              .single()

            if (instructor) {
              instructorName = (instructor as any).display_name ||
                `${(instructor as any).first_name || ''} ${(instructor as any).last_name || ''}`.trim() ||
                'Instructor'
            }
          }

          // Si el provider es 'direct' y el video_provider_id parece ser solo un path o nombre de archivo
          // (no empieza con 'http'), reconstruir la URL completa de Supabase Storage
          let videoProviderId = lesson.video_provider_id || ''
          if (lesson.video_provider === 'direct' && videoProviderId && !videoProviderId.startsWith('http')) {
            // Reconstruir URL de Supabase Storage
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
            if (supabaseUrl) {
              // Si el path no incluye el bucket, asumir que está en 'course-videos/videos'
              if (!videoProviderId.includes('/')) {
                videoProviderId = `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${videoProviderId}`
              } else {
                videoProviderId = `${supabaseUrl}/storage/v1/object/public/${videoProviderId}`
              }
            }
          }

          return {
            ...lesson,
            video_provider_id: videoProviderId,
            instructor_name: instructorName
          } as AdminLesson
        })
      )

      return lessonsWithInstructors
    } catch (error) {
      // console.error('Error in AdminLessonsService.getModuleLessons:', error)
      throw error
    }
  }

  static async getLessonById(lessonId: string): Promise<AdminLesson | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('lesson_id', lessonId)
        .single()

      if (error) {
        // console.error('Error fetching lesson:', error)
        throw error
      }

      // Obtener nombre del instructor
      if ((data as any)?.instructor_id) {
        const { data: instructor } = await supabase
          .from('users')
          .select('display_name, first_name, last_name')
          .eq('id', (data as any).instructor_id)
          .single()

        if (instructor) {
          (data as any).instructor_name = (instructor as any).display_name ||
            `${(instructor as any).first_name || ''} ${(instructor as any).last_name || ''}`.trim() ||
            'Instructor'
        }
      }

      return data as AdminLesson
    } catch (error) {
      // console.error('Error in AdminLessonsService.getLessonById:', error)
      return null
    }
  }

  static async createLesson(moduleId: string, lessonData: CreateLessonData, userId?: string): Promise<AdminLesson> {
    const supabase = await createClient()

    try {
      // Validar que duration_seconds sea mayor a 0
      if (!lessonData.duration_seconds || lessonData.duration_seconds <= 0) {
        throw new Error('La duración debe ser mayor a 0 segundos. Por favor, ingrese una duración válida.')
      }

      // Obtener el próximo order_index
      const { count } = await supabase
        .from('course_lessons')
        .select('*', { count: 'exact', head: true })
        .eq('module_id', moduleId)

      const nextOrderIndex = (count || 0) + 1

      // Asegurar que duration_seconds sea al menos 1 segundo
      const validDurationSeconds = Math.max(1, Math.floor(lessonData.duration_seconds))

      // Si el provider es 'direct' y la URL es de Supabase Storage, extraer solo el path relativo
      let videoProviderId = lessonData.video_provider_id
      if (lessonData.video_provider === 'direct' && videoProviderId.includes('supabase.co/storage/v1/object/public/')) {
        // Extraer el path después de '/public/'
        const publicIndex = videoProviderId.indexOf('/public/')
        if (publicIndex !== -1) {
          const path = videoProviderId.substring(publicIndex + 8) // +8 para saltar '/public/'
          // Si el path tiene el formato 'bucket/path', extraer solo 'path'
          // Si es muy largo (más de 50 caracteres), tomar solo el nombre del archivo
          if (path.length > 50) {
            const parts = path.split('/')
            videoProviderId = parts[parts.length - 1] // Solo el nombre del archivo
          } else {
            videoProviderId = path
          }
        }
      }

      // Asegurar que video_provider_id no exceda 50 caracteres (truncar si es necesario)
      if (videoProviderId.length > 50) {
        videoProviderId = videoProviderId.substring(0, 50)
      }

      const { data, error } = await supabase
        .from('course_lessons')
        .insert({
          module_id: moduleId,
          lesson_title: lessonData.lesson_title,
          lesson_description: lessonData.lesson_description,
          lesson_order_index: nextOrderIndex,
          video_provider_id: videoProviderId,
          video_provider: lessonData.video_provider,
          duration_seconds: validDurationSeconds,
          transcript_content: lessonData.transcript_content,
          summary_content: lessonData.summary_content,
          is_published: lessonData.is_published ?? false,
          instructor_id: lessonData.instructor_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any)
        .select()
        .single()

      if (error) {
        // console.error('Error creating lesson:', error)
        throw error
      }

      const createdLesson = data as any

      // Recalcular duración del módulo
      await this.updateModuleDuration(moduleId)

      // Traducir automáticamente la lección a inglés y portugués
      try {
        const { translateLessonOnCreate } = await import('../../../core/services/courseTranslation.service')
        await translateLessonOnCreate(
          createdLesson.lesson_id,
          {
            lesson_title: createdLesson.lesson_title,
            lesson_description: createdLesson.lesson_description,
            transcript_content: createdLesson.transcript_content,
            summary_content: createdLesson.summary_content
          },
          userId
        )
      } catch (translationError) {
        // No fallar la creación de la lección si falla la traducción
        console.error('Error en traducción automática de la lección:', translationError)
      }

      // Obtener nombre del instructor
      if (createdLesson?.instructor_id) {
        const { data: instructor } = await supabase
          .from('users')
          .select('display_name, first_name, last_name')
          .eq('id', createdLesson.instructor_id)
          .single()

        if (instructor) {
          createdLesson.instructor_name = (instructor as any).display_name ||
            `${(instructor as any).first_name || ''} ${(instructor as any).last_name || ''}`.trim() ||
            'Instructor'
        }
      }

      return createdLesson as AdminLesson
    } catch (error) {
      // console.error('Error in AdminLessonsService.createLesson:', error)
      throw error
    }
  }

  static async updateLesson(lessonId: string, lessonData: UpdateLessonData): Promise<AdminLesson> {
    const supabase = await createClient()

    try {
      // Si el provider es 'direct' y la URL es de Supabase Storage, extraer solo el path relativo
      let videoProviderId = lessonData.video_provider_id
      if (lessonData.video_provider === 'direct' && videoProviderId && videoProviderId.includes('supabase.co/storage/v1/object/public/')) {
        // Extraer el path después de '/public/'
        const publicIndex = videoProviderId.indexOf('/public/')
        if (publicIndex !== -1) {
          const path = videoProviderId.substring(publicIndex + 8) // +8 para saltar '/public/'
          // Si el path tiene el formato 'bucket/path', extraer solo 'path'
          // Si es muy largo (más de 50 caracteres), tomar solo el nombre del archivo
          if (path.length > 50) {
            const parts = path.split('/')
            videoProviderId = parts[parts.length - 1] // Solo el nombre del archivo
          } else {
            videoProviderId = path
          }
        }
      }

      // Asegurar que video_provider_id no exceda 50 caracteres (truncar si es necesario)
      if (videoProviderId && videoProviderId.length > 50) {
        videoProviderId = videoProviderId.substring(0, 50)
      }

      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      if (lessonData.lesson_title !== undefined) updateData.lesson_title = lessonData.lesson_title
      if (lessonData.lesson_description !== undefined) updateData.lesson_description = lessonData.lesson_description
      if (lessonData.video_provider_id !== undefined) updateData.video_provider_id = videoProviderId
      if (lessonData.video_provider !== undefined) updateData.video_provider = lessonData.video_provider
      if (lessonData.duration_seconds !== undefined) updateData.duration_seconds = Math.max(1, Math.floor(lessonData.duration_seconds))
      if (lessonData.transcript_content !== undefined) updateData.transcript_content = lessonData.transcript_content
      if (lessonData.summary_content !== undefined) updateData.summary_content = lessonData.summary_content
      if (lessonData.is_published !== undefined) updateData.is_published = lessonData.is_published
      if (lessonData.instructor_id !== undefined) updateData.instructor_id = lessonData.instructor_id

      const { data, error } = await supabase
        .from('course_lessons')
        .update(updateData)
        .eq('lesson_id', lessonId)
        .select()
        .single()

      if (error) {
        // console.error('Error updating lesson:', error)
        throw error
      }

      const updatedLesson = data as any

      // Recalcular duración del módulo
      if (updatedLesson?.module_id) {
        await this.updateModuleDuration(updatedLesson.module_id)
      }

      // Obtener nombre del instructor
      if (updatedLesson?.instructor_id) {
        const { data: instructor } = await supabase
          .from('users')
          .select('display_name, first_name, last_name')
          .eq('id', updatedLesson.instructor_id)
          .single()

        if (instructor) {
          updatedLesson.instructor_name = (instructor as any).display_name ||
            `${(instructor as any).first_name || ''} ${(instructor as any).last_name || ''}`.trim() ||
            'Instructor'
        }
      }

      return updatedLesson as AdminLesson
    } catch (error) {
      // console.error('Error in AdminLessonsService.updateLesson:', error)
      throw error
    }
  }

  static async deleteLesson(lessonId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener el module_id antes de eliminar
      const { data: lesson } = await supabase
        .from('course_lessons')
        .select('module_id')
        .eq('lesson_id', lessonId)
        .single()

      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('lesson_id', lessonId)

      if (error) {
        // console.error('Error deleting lesson:', error)
        throw error
      }

      // Recalcular duración del módulo si existía
      const lessonData = lesson as any
      if (lessonData?.module_id) {
        await this.updateModuleDuration(lessonData.module_id)
      }
    } catch (error) {
      // console.error('Error in AdminLessonsService.deleteLesson:', error)
      throw error
    }
  }

  static async reorderLessons(moduleId: string, lessons: Array<{ lesson_id: string, lesson_order_index: number }>): Promise<void> {
    const supabase = await createClient()

    try {
      // 1. First, update all to shifted positive values (e.g. +10000) to avoid UNIQUE and CHECK(>0) constraint violations on `lesson_order_index`
      const tempUpdates = lessons.map((lesson) => {
        return supabase
          .from('course_lessons')
          .update({
            lesson_order_index: lesson.lesson_order_index + 10000,
            updated_at: new Date().toISOString()
          })
          .eq('lesson_id', lesson.lesson_id)
      })

      const tempResults = await Promise.all(tempUpdates)
      const tempErrors = tempResults.filter(r => r.error)

      if (tempErrors.length > 0) {
        console.error('Error pre-reordering lessons (temp values):', tempErrors)
        throw new Error(`Error al reordenar (fase 1): ${tempErrors[0].error?.message || 'Unknown error'}`)
      }

      // 2. Then update to final positive values
      const finalUpdates = lessons.map((lesson) => {
        return supabase
          .from('course_lessons')
          .update({
            lesson_order_index: lesson.lesson_order_index,
            updated_at: new Date().toISOString()
          })
          .eq('lesson_id', lesson.lesson_id)
      })

      const finalResults = await Promise.all(finalUpdates)
      const finalErrors = finalResults.filter(r => r.error)

      if (finalErrors.length > 0) {
        console.error('Error reordering lessons (final values):', finalErrors)
        throw new Error(`Error al reordenar lecciones: ${finalErrors[0].error?.message || 'Unknown error'}`)
      }
    } catch (error) {
      // console.error('Error in AdminLessonsService.reorderLessons:', error)
      throw error
    }
  }

  static async toggleLessonPublished(lessonId: string): Promise<AdminLesson> {
    const supabase = await createClient()

    try {
      const { data: currentLesson } = await supabase
        .from('course_lessons')
        .select('is_published')
        .eq('lesson_id', lessonId)
        .single()

      if (!currentLesson) {
        throw new Error('Lección no encontrada')
      }

      const updateData = {
        is_published: !(currentLesson as any).is_published,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('course_lessons')
        .update(updateData)
        .eq('lesson_id', lessonId)
        .select()
        .single()

      if (error) {
        // console.error('Error toggling lesson published:', error)
        throw error
      }

      return (data as any) as AdminLesson
    } catch (error) {
      // console.error('Error in AdminLessonsService.toggleLessonPublished:', error)
      throw error
    }
  }

  static async updateModuleDuration(moduleId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener todas las lecciones del módulo con sus IDs y duraciones
      const { data: lessons } = await supabase
        .from('course_lessons')
        .select('lesson_id, duration_seconds')
        .eq('module_id', moduleId)

      const lessonsList = lessons as any[] || []
      const lessonIds = lessonsList.map((l: any) => l.lesson_id)

      // Sumar duración de videos (en segundos, convertidos a minutos)
      const totalVideoSeconds = lessonsList.reduce((sum: number, lesson: any) => sum + (lesson.duration_seconds || 0), 0)
      const videoMinutes = Math.round(totalVideoSeconds / 60)

      let materialsMinutes = 0
      let activitiesMinutes = 0

      if (lessonIds.length > 0) {
        // Sumar tiempo estimado de materiales
        const { data: materials } = await supabase
          .from('lesson_materials')
          .select('estimated_time_minutes')
          .in('lesson_id', lessonIds)

        materialsMinutes = (materials as any[] || []).reduce((sum: number, m: any) => sum + (m.estimated_time_minutes || 0), 0)

        // Sumar tiempo estimado de actividades
        const { data: activities } = await supabase
          .from('lesson_activities')
          .select('estimated_time_minutes')
          .in('lesson_id', lessonIds)

        activitiesMinutes = (activities as any[] || []).reduce((sum: number, a: any) => sum + (a.estimated_time_minutes || 0), 0)
      }

      // Total = videos + materiales + actividades
      const totalMinutes = videoMinutes + materialsMinutes + activitiesMinutes

      // Actualizar duración del módulo
      const moduleUpdateData = {
        module_duration_minutes: totalMinutes,
        updated_at: new Date().toISOString()
      }
      await supabase
        .from('course_modules')
        .update(moduleUpdateData)
        .eq('module_id', moduleId)

      // Obtener course_id del módulo para actualizar duración del curso
      const { data: module } = await supabase
        .from('course_modules')
        .select('course_id')
        .eq('module_id', moduleId)
        .single()

      if ((module as any)?.course_id) {
        await this.updateCourseDuration((module as any).course_id)
      }
    } catch (error) {
      // console.error('Error in AdminLessonsService.updateModuleDuration:', error)
      throw error
    }
  }

  static async updateCourseDuration(courseId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Sumar duración de todos los módulos
      const { data: modules } = await supabase
        .from('course_modules')
        .select('module_duration_minutes')
        .eq('course_id', courseId)

      const totalMinutes = (modules as any[])?.reduce((sum: number, module: any) => sum + (module.module_duration_minutes || 0), 0) || 0

      // Actualizar duración del curso
      const courseUpdateData = {
        duration_total_minutes: totalMinutes,
        updated_at: new Date().toISOString()
      }
      await supabase
        .from('courses')
        .update(courseUpdateData)
        .eq('id', courseId)
    } catch (error) {
      // console.error('Error in AdminLessonsService.updateCourseDuration:', error)
      throw error
    }
  }

  /**
   * Recalcula la duración total de TODAS las lecciones en la base de datos.
   * Útil para corregir datos existentes que no fueron calculados correctamente.
   * 
   * Esta función:
   * 1. Obtiene todas las lecciones
   * 2. Para cada lección, suma: video + materiales + actividades
   * 3. Actualiza el campo total_duration_minutes
   * 4. Recalcula la duración de todos los módulos y cursos afectados
   */
  static async recalculateAllLessonDurations(): Promise<{ updated: number; errors: string[] }> {
    const supabase = await createClient()
    const errors: string[] = []
    let updated = 0

    try {
      // Obtener todas las lecciones
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('lesson_id, duration_seconds, module_id')
        .order('lesson_id')

      if (lessonsError) {
        throw lessonsError
      }

      if (!lessons || lessons.length === 0) {
        return { updated: 0, errors: [] }
      }

      console.log(`[AdminLessonsService] Recalculating durations for ${lessons.length} lessons...`)

      // Obtener TODOS los materiales y actividades de una sola vez (más eficiente)
      const lessonIds = lessons.map((l: any) => l.lesson_id)

      const { data: allMaterials } = await supabase
        .from('lesson_materials')
        .select('lesson_id, estimated_time_minutes')
        .in('lesson_id', lessonIds)

      const { data: allActivities } = await supabase
        .from('lesson_activities')
        .select('lesson_id, estimated_time_minutes')
        .in('lesson_id', lessonIds)

      // Crear mapas para acceso rápido
      const materialsByLesson = new Map<string, number>()
      const activitiesByLesson = new Map<string, number>()

      // Agrupar tiempos de materiales por lección
      for (const m of (allMaterials || [])) {
        const current = materialsByLesson.get((m as any).lesson_id) || 0
        materialsByLesson.set((m as any).lesson_id, current + ((m as any).estimated_time_minutes || 0))
      }

      // Agrupar tiempos de actividades por lección
      for (const a of (allActivities || [])) {
        const current = activitiesByLesson.get((a as any).lesson_id) || 0
        activitiesByLesson.set((a as any).lesson_id, current + ((a as any).estimated_time_minutes || 0))
      }

      // Actualizar cada lección
      const moduleIds = new Set<string>()

      for (const lesson of lessons) {
        try {
          const lessonId = (lesson as any).lesson_id
          const moduleId = (lesson as any).module_id
          const videoSeconds = (lesson as any).duration_seconds || 0
          const videoMinutes = Math.round(videoSeconds / 60)

          const materialsMinutes = materialsByLesson.get(lessonId) || 0
          const activitiesMinutes = activitiesByLesson.get(lessonId) || 0

          const totalDurationMinutes = videoMinutes + materialsMinutes + activitiesMinutes

          const { error: updateError } = await supabase
            .from('course_lessons')
            .update({
              total_duration_minutes: totalDurationMinutes,
              updated_at: new Date().toISOString()
            } as any)
            .eq('lesson_id', lessonId)

          if (updateError) {
            errors.push(`Lesson ${lessonId}: ${updateError.message}`)
          } else {
            updated++
            console.log(`  ✓ Lesson ${lessonId}: video=${videoMinutes}min + materials=${materialsMinutes}min + activities=${activitiesMinutes}min = ${totalDurationMinutes}min`)

            if (moduleId) {
              moduleIds.add(moduleId)
            }
          }
        } catch (err) {
          errors.push(`Lesson ${(lesson as any).lesson_id}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      // Recalcular duración de los módulos afectados
      console.log(`[AdminLessonsService] Recalculating ${moduleIds.size} module durations...`)
      for (const moduleId of moduleIds) {
        try {
          await this.updateModuleDuration(moduleId)
        } catch (err) {
          errors.push(`Module ${moduleId}: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      console.log(`[AdminLessonsService] Recalculation complete: ${updated} lessons updated, ${errors.length} errors`)
      return { updated, errors }
    } catch (error) {
      console.error('Error in AdminLessonsService.recalculateAllLessonDurations:', error)
      throw error
    }
  }
}

