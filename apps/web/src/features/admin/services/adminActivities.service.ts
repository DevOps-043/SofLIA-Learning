import { createClient } from '../../../lib/supabase/server'
import { logger } from '../../../lib/logger'
import type {
  ActivityConfig,
  ExternalToolKey,
} from '@/features/courses/types/activity-config'

export interface AdminActivity {
  activity_id: string
  activity_title: string
  activity_description: string | null
  activity_type: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat' | 'reading'
  activity_content: string
  activity_config: ActivityConfig | null
  activity_schema_version: number
  ai_prompts: string | null
  activity_order_index: number
  external_tool_key: ExternalToolKey | null
  is_required: boolean
  estimated_time_minutes: number | null
  lesson_id: string
  requires_soflia_validation: boolean
  created_at: string
}

export interface CreateActivityData {
  activity_title: string
  activity_description?: string
  activity_type: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat' | 'reading'
  activity_content: string
  activity_config?: ActivityConfig | null
  activity_schema_version?: number
  ai_prompts?: string
  external_tool_key?: ExternalToolKey | null
  is_required?: boolean
  estimated_time_minutes?: number
  requires_soflia_validation?: boolean
}

export interface UpdateActivityData {
  activity_title?: string
  activity_description?: string
  activity_type?: 'reflection' | 'exercise' | 'quiz' | 'discussion' | 'ai_chat' | 'reading'
  activity_content?: string
  activity_config?: ActivityConfig | null
  activity_schema_version?: number
  ai_prompts?: string
  external_tool_key?: ExternalToolKey | null
  is_required?: boolean
  estimated_time_minutes?: number
  requires_soflia_validation?: boolean
}

export class AdminActivitiesService {
  static async getLessonActivities(lessonId: string): Promise<AdminActivity[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_activities')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('activity_order_index', { ascending: true })

      if (error) {
        logger.error('Error fetching activities', { error: error.message, lessonId })
        throw error
      }

      return data || []
    } catch (error) {
      logger.error('Error in AdminActivitiesService.getLessonActivities', { error: error instanceof Error ? error.message : String(error), lessonId })
      throw error
    }
  }

  static async getActivityById(activityId: string): Promise<AdminActivity | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_activities')
        .select('*')
        .eq('activity_id', activityId)
        .single()

      if (error) {
        logger.error('Error fetching activity', { error: error.message, activityId })
        throw error
      }

      return data
    } catch (error) {
      logger.error('Error in AdminActivitiesService.getActivityById', { error: error instanceof Error ? error.message : String(error), activityId })
      return null
    }
  }

  static async createActivity(lessonId: string, activityData: CreateActivityData, userId?: string): Promise<AdminActivity> {
    const supabase = await createClient()

    try {
      // Obtener el próximo order_index
      const { count } = await supabase
        .from('lesson_activities')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lessonId)

      const nextOrderIndex = (count || 0) + 1

      const { data, error } = await supabase
        .from('lesson_activities')
        .insert({
          lesson_id: lessonId,
          activity_title: activityData.activity_title,
          activity_description: activityData.activity_description,
          activity_type: activityData.activity_type,
          activity_content: activityData.activity_content,
          activity_config: activityData.activity_config ?? null,
          activity_schema_version: activityData.activity_schema_version ?? 1,
          ai_prompts: activityData.ai_prompts,
          activity_order_index: nextOrderIndex,
          external_tool_key: activityData.external_tool_key ?? null,
          is_required: activityData.is_required ?? false,
          estimated_time_minutes: activityData.estimated_time_minutes || 5, // Default 5 min
          requires_soflia_validation: activityData.requires_soflia_validation ?? false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        logger.error('Error creating activity', { error: error.message, lessonId })
        throw error
      }

      // Traducir automáticamente la actividad a inglés y portugués
      try {
        const { translateActivityOnCreate } = await import('@/core/services/courseTranslation.service')
        await translateActivityOnCreate(
          data.activity_id,
          {
            activity_title: data.activity_title,
            activity_description: data.activity_description,
            activity_content: data.activity_content,
            ai_prompts: data.ai_prompts
          },
          userId
        )
      } catch (translationError) {
        // No fallar la creación de la actividad si falla la traducción
        logger.error('Error en traducción automática de la actividad', {
          error: translationError instanceof Error ? translationError.message : String(translationError),
          activityId: data.activity_id
        })
      }

      // Recalcular duración del módulo
      await this.updateModuleDurationFromLesson(lessonId)

      return data
    } catch (error) {
      logger.error('Error in AdminActivitiesService.createActivity', { error: error instanceof Error ? error.message : String(error), lessonId })
      throw error
    }
  }

  static async updateActivity(activityId: string, activityData: UpdateActivityData): Promise<AdminActivity> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_activities')
        .update(activityData)
        .eq('activity_id', activityId)
        .select()
        .single()

      if (error) {
        logger.error('Error updating activity', { error: error.message, activityId })
        throw error
      }

      // Recalcular duración del módulo si cambió el tiempo estimado
      if (activityData.estimated_time_minutes !== undefined) {
        const lessonId = data.lesson_id
        await this.updateModuleDurationFromLesson(lessonId)
      }

      return data
    } catch (error) {
      logger.error('Error in AdminActivitiesService.updateActivity', { error: error instanceof Error ? error.message : String(error), activityId })
      throw error
    }
  }

  static async deleteActivity(activityId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener lesson_id antes de eliminar para recalcular duración
      const { data: activity } = await supabase
        .from('lesson_activities')
        .select('lesson_id')
        .eq('activity_id', activityId)
        .single()

      const lessonId = (activity as { lesson_id: string } | null)?.lesson_id

      const { error } = await supabase
        .from('lesson_activities')
        .delete()
        .eq('activity_id', activityId)

      if (error) {
        logger.error('Error deleting activity', { error: error.message, activityId })
        throw error
      }

      // Recalcular duración del módulo
      if (lessonId) {
        await this.updateModuleDurationFromLesson(lessonId)
      }
    } catch (error) {
      logger.error('Error in AdminActivitiesService.deleteActivity', { error: error instanceof Error ? error.message : String(error), activityId })
      throw error
    }
  }

  static async reorderActivities(lessonId: string, activities: Array<{ activity_id: string, activity_order_index: number }>): Promise<void> {
    const supabase = await createClient()

    try {
      const updates = activities.map((activity) =>
        supabase
          .from('lesson_activities')
          .update({ activity_order_index: activity.activity_order_index })
          .eq('activity_id', activity.activity_id)
      )

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)

      if (errors.length > 0) {
        logger.error('Error reordering activities', { errorCount: errors.length, lessonId })
        throw new Error('Error al reordenar actividades')
      }
    } catch (error) {
      logger.error('Error in AdminActivitiesService.reorderActivities', { error: error instanceof Error ? error.message : String(error), lessonId })
      throw error
    }
  }

  /**
   * Helper para recalcular la duración del módulo cuando cambian las actividades
   */
  static async updateModuleDurationFromLesson(lessonId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // PRIMERO: Recalcular la duración TOTAL de la lección
      await this.recalculateLessonDuration(lessonId)

      // SEGUNDO: Obtener el module_id de la lección
      const { data: lesson } = await supabase
        .from('course_lessons')
        .select('module_id')
        .eq('lesson_id', lessonId)
        .single()

      const lessonData = lesson as { module_id: string } | null
      if (lessonData?.module_id) {
        // Importar el servicio de lecciones para recalcular la duración del módulo
        const { AdminLessonsService } = await import('./adminLessons.service')
        await AdminLessonsService.updateModuleDuration(lessonData.module_id)
      }
    } catch (error) {
      // No fallar si hay error recalculando duración
      logger.error('Error updating module duration from lesson', {
        error: error instanceof Error ? error.message : String(error),
        lessonId
      })
    }
  }

  /**
   * Recalcula la duración total de una lección individual (video + materiales + actividades)
   * y actualiza el campo total_duration_minutes en course_lessons
   */
  static async recalculateLessonDuration(lessonId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // 1. Obtener la duración del video de la lección
      const { data: lesson } = await supabase
        .from('course_lessons')
        .select('duration_seconds')
        .eq('lesson_id', lessonId)
        .single()

      const lessonRow = lesson as { duration_seconds: number } | null
      const videoSeconds = lessonRow?.duration_seconds || 0
      const videoMinutes = Math.round(videoSeconds / 60)

      // 2. Sumar tiempo estimado de todos los materiales de esta lección
      const { data: materials } = await supabase
        .from('lesson_materials')
        .select('estimated_time_minutes')
        .eq('lesson_id', lessonId)

      const materialsMinutes = (materials ?? []).reduce(
        (sum: number, m: { estimated_time_minutes: number | null }) => sum + (m.estimated_time_minutes || 0),
        0
      )

      // 3. Sumar tiempo estimado de todas las actividades de esta lección
      const { data: activities } = await supabase
        .from('lesson_activities')
        .select('estimated_time_minutes')
        .eq('lesson_id', lessonId)

      const activitiesMinutes = (activities ?? []).reduce(
        (sum: number, a: { estimated_time_minutes: number | null }) => sum + (a.estimated_time_minutes || 0),
        0
      )

      // 4. Calcular total y actualizar la lección
      const totalDurationMinutes = videoMinutes + materialsMinutes + activitiesMinutes

      await supabase
        .from('course_lessons')
        .update({
          total_duration_minutes: totalDurationMinutes,
          updated_at: new Date().toISOString()
        })
        .eq('lesson_id', lessonId)

      logger.debug('Lesson duration recalculated', {
        lessonId,
        videoMinutes,
        materialsMinutes,
        activitiesMinutes,
        totalDurationMinutes
      })
    } catch (error) {
      logger.error('Error recalculating lesson duration', {
        error: error instanceof Error ? error.message : String(error),
        lessonId
      })
      // No propagar el error para no fallar la operación principal
    }
  }
}
