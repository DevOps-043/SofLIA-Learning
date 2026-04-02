import { createClient } from '../../../lib/supabase/server'

export interface AdminMaterial {
  material_id: string
  material_title: string
  material_description: string | null
  material_type: 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading'
  file_url: string | null
  external_url: string | null
  content_data: Record<string, unknown> | null
  material_order_index: number
  is_downloadable: boolean
  estimated_time_minutes: number | null
  lesson_id: string
  created_at: string
}

export interface CreateMaterialData {
  material_title: string
  material_description?: string
  material_type: 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading'
  file_url?: string
  external_url?: string
  content_data?: Record<string, unknown>
  is_downloadable?: boolean
  estimated_time_minutes?: number
}

export interface UpdateMaterialData {
  material_title?: string
  material_description?: string
  material_type?: 'pdf' | 'link' | 'document' | 'quiz' | 'exercise' | 'reading'
  file_url?: string
  external_url?: string
  content_data?: Record<string, unknown>
  is_downloadable?: boolean
  estimated_time_minutes?: number
}

export class AdminMaterialsService {
  static async getLessonMaterials(lessonId: string): Promise<AdminMaterial[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('material_order_index', { ascending: true })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      throw error
    }
  }

  static async getMaterialById(materialId: string): Promise<AdminMaterial | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_materials')
        .select('*')
        .eq('material_id', materialId)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      return null
    }
  }

  static async createMaterial(lessonId: string, materialData: CreateMaterialData, userId?: string): Promise<AdminMaterial> {
    const supabase = await createClient()

    try {
      // Obtener el próximo order_index
      const { count } = await supabase
        .from('lesson_materials')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lessonId)

      const nextOrderIndex = (count || 0) + 1

      const insertData: Record<string, unknown> = {
        lesson_id: lessonId,
        material_title: materialData.material_title,
        material_description: materialData.material_description,
        material_type: materialData.material_type,
        material_order_index: nextOrderIndex,
        is_downloadable: materialData.is_downloadable ?? false,
        estimated_time_minutes: materialData.estimated_time_minutes || 10, // Default 10 min
        created_at: new Date().toISOString()
      }

      // Setear URLs según el tipo
      if (materialData.material_type === 'link') {
        insertData.external_url = materialData.external_url
      } else if (['pdf', 'document'].includes(materialData.material_type)) {
        insertData.file_url = materialData.file_url
      } else if (['quiz', 'exercise'].includes(materialData.material_type)) {
        insertData.content_data = materialData.content_data || {}
      }

      const { data, error } = await supabase
        .from('lesson_materials')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Traducir automáticamente el material a inglés y portugués
      try {
        const { translateMaterialOnCreate } = await import('@/core/services/courseTranslation.service')
        await translateMaterialOnCreate(
          data.material_id,
          {
            material_title: data.material_title,
            material_description: data.material_description,
            content_data: data.content_data
          },
          userId
        )
      } catch (translationError) {
        // No fallar la creación del material si falla la traducción
        console.error('Error en traducción automática del material:', translationError)
      }

      // Recalcular duración del módulo
      await this.updateModuleDurationFromLesson(lessonId)

      return data
    } catch (error) {
      throw error
    }
  }

  static async updateMaterial(materialId: string, materialData: UpdateMaterialData): Promise<AdminMaterial> {
    const supabase = await createClient()

    try {
      const updateData: Record<string, unknown> = { ...materialData }

      // Si cambia el tipo, resetear URLs no relevantes
      if (materialData.material_type === 'link') {
        updateData.external_url = materialData.external_url
        updateData.file_url = null
        updateData.content_data = null
      } else if (['pdf', 'document'].includes(materialData.material_type || '')) {
        updateData.file_url = materialData.file_url
        updateData.external_url = null
        updateData.content_data = null
      } else if (['quiz', 'exercise'].includes(materialData.material_type || '')) {
        updateData.content_data = materialData.content_data || {}
        updateData.file_url = null
        updateData.external_url = null
      }

      const { data, error } = await supabase
        .from('lesson_materials')
        .update(updateData)
        .eq('material_id', materialId)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Recalcular duración del módulo si cambió el tiempo estimado
      if (materialData.estimated_time_minutes !== undefined) {
        const lessonId = data.lesson_id
        await this.updateModuleDurationFromLesson(lessonId)
      }

      return data
    } catch (error) {
      throw error
    }
  }

  static async deleteMaterial(materialId: string): Promise<void> {
    const supabase = await createClient()

    try {
      // Obtener información del material antes de eliminar (para eliminar archivo si aplica y para recalcular duración)
      const { data: material } = await supabase
        .from('lesson_materials')
        .select('file_url, lesson_id')
        .eq('material_id', materialId)
        .single()

      const lessonId = (material as { lesson_id: string } | null)?.lesson_id

      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('material_id', materialId)

      if (error) {
        throw error
      }

      // Recalcular duración del módulo
      if (lessonId) {
        await this.updateModuleDurationFromLesson(lessonId)
      }

      // TODO: Eliminar archivo de Supabase Storage si existe file_url
      // Esto se implementaría en el futuro si es necesario
    } catch (error) {
      throw error
    }
  }

  static async reorderMaterials(lessonId: string, materials: Array<{ material_id: string, material_order_index: number }>): Promise<void> {
    const supabase = await createClient()

    try {
      const updates = materials.map((material) =>
        supabase
          .from('lesson_materials')
          .update({ material_order_index: material.material_order_index })
          .eq('material_id', material.material_id)
      )

      const results = await Promise.all(updates)
      const errors = results.filter(r => r.error)

      if (errors.length > 0) {
        throw new Error('Error al reordenar materiales')
      }
    } catch (error) {
      throw error
    }
  }

  static async uploadMaterialFile(file: File, materialType: string): Promise<string> {
    try {
      const supabase = await createClient()

      // Generar nombre único
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const folder = materialType === 'pdf' ? 'pdfs' : 'documents'
      const filePath = `course-materials/${folder}/${fileName}`

      // Subir archivo
      const { data, error } = await supabase.storage
        .from('course-materials')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      throw error
    }
  }

  /**
   * Helper para recalcular la duración del módulo cuando cambian los materiales
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

      const lessonRow = lesson as { module_id?: string } | null
      if (lessonRow?.module_id) {
        const { AdminLessonsService } = await import('./adminLessons.service')
        await AdminLessonsService.updateModuleDuration(lessonRow.module_id)
      }
    } catch (error) {
      // No fallar si hay error recalculando duración
      console.error('Error updating module duration from lesson:', error)
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

      const lessonForDuration = lesson as { duration_seconds?: number } | null
      const videoSeconds = lessonForDuration?.duration_seconds || 0
      const videoMinutes = Math.round(videoSeconds / 60)

      // 2. Sumar tiempo estimado de todos los materiales de esta lección
      const { data: materials } = await supabase
        .from('lesson_materials')
        .select('estimated_time_minutes')
        .eq('lesson_id', lessonId)

      const materialsMinutes = (materials || []).reduce(
        (sum: number, m: { estimated_time_minutes?: number | null }) => sum + (m.estimated_time_minutes || 0),
        0
      )

      // 3. Sumar tiempo estimado de todas las actividades de esta lección
      const { data: activities } = await supabase
        .from('lesson_activities')
        .select('estimated_time_minutes')
        .eq('lesson_id', lessonId)

      const activitiesMinutes = (activities || []).reduce(
        (sum: number, a: { estimated_time_minutes?: number | null }) => sum + (a.estimated_time_minutes || 0),
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

    } catch (error) {
      console.error('Error recalculating lesson duration:', error)
      // No propagar el error para no fallar la operación principal
    }
  }
}

