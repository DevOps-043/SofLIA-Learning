import { createClient } from '../../../lib/supabase/server'

export interface AdminModule {
  module_id: string
  module_title: string
  module_description: string | null
  module_order_index: number
  module_duration_minutes: number
  is_required: boolean
  is_published: boolean
  course_id: string
  created_at: string
  updated_at: string
  lessons?: AdminLesson[] // Opcional para vista anidada
}

export interface AdminLesson {
  lesson_id: string
  lesson_title: string
  lesson_description: string | null
  lesson_order_index: number
  video_provider_id: string
  video_provider: 'youtube' | 'vimeo' | 'direct' | 'custom'
  duration_seconds: number
  transcript_content: string | null
  summary_content: string | null
  is_published: boolean
  module_id: string
  instructor_id: string
  instructor_name?: string // Calculado
  created_at: string
  updated_at: string
}

export interface CreateModuleData {
  module_title: string
  module_description?: string
  is_required?: boolean
  is_published?: boolean
}

export interface UpdateModuleData {
  module_title?: string
  module_description?: string
  is_required?: boolean
  is_published?: boolean
}

export class AdminModulesService {
  static async getCourseModules(courseId: string): Promise<AdminModule[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select(`
          module_id,
          module_title,
          module_description,
          module_order_index,
          module_duration_minutes,
          is_required,
          is_published,
          course_id,
          created_at,
          updated_at
        `)
        .eq('course_id', courseId)
        .order('module_order_index', { ascending: true })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      throw error
    }
  }

  static async getModuleById(moduleId: string): Promise<AdminModule | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('module_id', moduleId)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      return null
    }
  }

  static async createModule(courseId: string, moduleData: CreateModuleData, userId?: string): Promise<AdminModule> {
    const supabase = await createClient()

    try {
      // Intentar extraer el número del módulo del título (ej: "Módulo 1" -> 1)
      const extractModuleNumber = (title: string): number | null => {
        const match = title.match(/Módulo\s*(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
      };

      let moduleOrderIndex: number;
      const extractedNumber = extractModuleNumber(moduleData.module_title);

      if (extractedNumber !== null) {
        // Si se puede extraer un número del título, usarlo como order_index
        moduleOrderIndex = extractedNumber;
      } else {
        // Si no hay número en el título, usar el máximo order_index + 1
        const { data: existingModules } = await supabase
          .from('course_modules')
          .select('module_order_index')
          .eq('course_id', courseId)
          .order('module_order_index', { ascending: false })
          .limit(1)
          .single()

        const maxOrderIndex = existingModules?.module_order_index || 0;
        moduleOrderIndex = maxOrderIndex + 1;
      }

      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: courseId,
          module_title: moduleData.module_title,
          module_description: moduleData.module_description,
          module_order_index: moduleOrderIndex,
          module_duration_minutes: 0,
          is_required: moduleData.is_required ?? true,
          is_published: moduleData.is_published ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Traducir automáticamente el módulo a inglés y portugués
      try {
        const { translateModuleOnCreate } = await import('@/core/services/courseTranslation.service')
        await translateModuleOnCreate(
          data.module_id,
          {
            module_title: data.module_title,
            module_description: data.module_description
          },
          userId
        )
      } catch (translationError) {
        // No fallar la creación del módulo si falla la traducción
        console.error('Error en traducción automática del módulo:', translationError)
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async updateModule(moduleId: string, moduleData: UpdateModuleData): Promise<AdminModule> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('course_modules')
        .update({
          ...moduleData,
          updated_at: new Date().toISOString()
        })
        .eq('module_id', moduleId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async deleteModule(moduleId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Primero obtener todas las lecciones del módulo
      const { data: lessons, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('lesson_id')
        .eq('module_id', moduleId)

      if (lessonsError) {
        throw lessonsError
      }

      // Eliminar todas las lecciones asociadas (y sus materiales/actividades en cascada si están configurados)
      if (lessons && lessons.length > 0) {
        const lessonIds = lessons.map((lesson: any) => lesson.lesson_id)

        // Eliminar materiales de todas las lecciones
        for (const lessonId of lessonIds) {
          const { error: materialsError } = await supabase
            .from('lesson_materials')
            .delete()
            .eq('lesson_id', lessonId)

          if (materialsError) {
            // Continuar aunque falle, no es crítico
          }

          // Eliminar actividades de todas las lecciones
          const { error: activitiesError } = await supabase
            .from('lesson_activities')
            .delete()
            .eq('lesson_id', lessonId)

          if (activitiesError) {
            // Continuar aunque falle, no es crítico
          }
        }

        // Eliminar todas las lecciones del módulo
        const { error: deleteLessonsError } = await supabase
          .from('course_lessons')
          .delete()
          .eq('module_id', moduleId)

        if (deleteLessonsError) {
          throw deleteLessonsError
        }
      }

      // Finalmente eliminar el módulo
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('module_id', moduleId)

      if (error) {
        throw error
      }
    } catch (error) {
      throw error
    }
  }

  static async reorderModules(courseId: string, modules: Array<{ module_id: string, module_order_index: number }>): Promise<void> {
    const supabase = await createClient()

    try {
      // Actualizar cada módulo con su nuevo order_index
      const updates = modules.map((module) =>
        supabase
          .from('course_modules')
          .update({ module_order_index: module.module_order_index, updated_at: new Date().toISOString() })
          .eq('module_id', module.module_id)
      )

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)

      if (errors.length > 0) {
        throw new Error('Error al reordenar módulos')
      }
    } catch (error) {
      throw error
    }
  }

  static async toggleModulePublished(moduleId: string): Promise<AdminModule> {
    const supabase = await createClient()

    try {
      // Obtener el estado actual
      const { data: currentModule } = await supabase
        .from('course_modules')
        .select('is_published')
        .eq('module_id', moduleId)
        .single()

      if (!currentModule) {
        throw new Error('Módulo no encontrado')
      }

      const { data, error } = await supabase
        .from('course_modules')
        .update({
          is_published: !currentModule.is_published,
          updated_at: new Date().toISOString()
        })
        .eq('module_id', moduleId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async calculateModuleDuration(moduleId: string): Promise<number> {
    const supabase = await createClient()

    try {
      // Obtener todas las lecciones del módulo con su duración
      const { data: lessons, error } = await supabase
        .from('course_lessons')
        .select('lesson_id, duration_seconds')
        .eq('module_id', moduleId)

      if (error) {
        throw error
      }

      // Sumar duración de videos (en segundos, convertidos a minutos)
      const totalVideoSeconds = lessons?.reduce((sum, lesson) => sum + (lesson.duration_seconds || 0), 0) || 0
      const videoMinutes = Math.round(totalVideoSeconds / 60)

      // Obtener los IDs de las lecciones para buscar materiales y actividades
      const lessonIds = lessons?.map(l => l.lesson_id) || []

      let materialsMinutes = 0
      let activitiesMinutes = 0

      if (lessonIds.length > 0) {
        // Sumar tiempo estimado de materiales
        const { data: materials } = await supabase
          .from('lesson_materials')
          .select('estimated_time_minutes')
          .in('lesson_id', lessonIds)

        materialsMinutes = materials?.reduce((sum, m) => sum + (m.estimated_time_minutes || 0), 0) || 0

        // Sumar tiempo estimado de actividades
        const { data: activities } = await supabase
          .from('lesson_activities')
          .select('estimated_time_minutes')
          .in('lesson_id', lessonIds)

        activitiesMinutes = activities?.reduce((sum, a) => sum + (a.estimated_time_minutes || 0), 0) || 0
      }

      // Total = videos + materiales + actividades
      const totalMinutes = videoMinutes + materialsMinutes + activitiesMinutes

      // Actualizar el módulo con la duración total
      await supabase
        .from('course_modules')
        .update({ module_duration_minutes: totalMinutes })
        .eq('module_id', moduleId)

      return totalMinutes
    } catch (error) {
      throw error
    }
  }
}

