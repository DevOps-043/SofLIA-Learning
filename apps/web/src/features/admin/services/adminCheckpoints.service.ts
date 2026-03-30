import { createClient } from '../../../lib/supabase/server'

export interface AdminCheckpoint {
  checkpoint_id: string
  checkpoint_time_seconds: number
  checkpoint_label: string | null
  checkpoint_description: string | null
  is_required_completion: boolean
  checkpoint_order_index: number
  lesson_id: string
  created_at: string
}

export interface CreateCheckpointData {
  checkpoint_time_seconds: number
  checkpoint_label?: string
  checkpoint_description?: string
  is_required_completion?: boolean
}

export interface UpdateCheckpointData {
  checkpoint_time_seconds?: number
  checkpoint_label?: string
  checkpoint_description?: string
  is_required_completion?: boolean
}

export class AdminCheckpointsService {
  static async getLessonCheckpoints(lessonId: string): Promise<AdminCheckpoint[]> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_checkpoints')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('checkpoint_order_index', { ascending: true })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      throw error
    }
  }

  static async getCheckpointById(checkpointId: string): Promise<AdminCheckpoint | null> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_checkpoints')
        .select('*')
        .eq('checkpoint_id', checkpointId)
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      return null
    }
  }

  static async createCheckpoint(lessonId: string, checkpointData: CreateCheckpointData): Promise<AdminCheckpoint> {
    const supabase = await createClient()

    try {
      // Obtener el próximo order_index
      const { count } = await supabase
        .from('lesson_checkpoints')
        .select('*', { count: 'exact', head: true })
        .eq('lesson_id', lessonId)

      const nextOrderIndex = (count || 0) + 1

      const { data, error } = await supabase
        .from('lesson_checkpoints')
        .insert({
          lesson_id: lessonId,
          checkpoint_time_seconds: checkpointData.checkpoint_time_seconds,
          checkpoint_label: checkpointData.checkpoint_label,
          checkpoint_description: checkpointData.checkpoint_description,
          is_required_completion: checkpointData.is_required_completion ?? false,
          checkpoint_order_index: nextOrderIndex,
          created_at: new Date().toISOString()
        })
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

  static async updateCheckpoint(checkpointId: string, checkpointData: UpdateCheckpointData): Promise<AdminCheckpoint> {
    const supabase = await createClient()

    try {
      const { data, error } = await supabase
        .from('lesson_checkpoints')
        .update(checkpointData)
        .eq('checkpoint_id', checkpointId)
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

  static async deleteCheckpoint(checkpointId: string): Promise<void> {
    const supabase = await createClient()

    try {
      const { error } = await supabase
        .from('lesson_checkpoints')
        .delete()
        .eq('checkpoint_id', checkpointId)

      if (error) {
        throw error
      }
    } catch (error) {
      throw error
    }
  }
}

