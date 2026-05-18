import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../lib/supabase/server'

export interface DashboardLayout {
  id: string | null
  name: string
  layout_config: {
    widgets: Array<{
      id: string
      type: string
      position: {
        x: number
        y: number
        w: number
        h: number
      }
    }>
  }
  is_default: boolean
}

export class AdminDashboardLayoutService {
  /**
   * Obtener layout del administrador
   */
  static async getLayout(userId: string): Promise<DashboardLayout | null> {
    try {
      const supabase = await createClient()
      
      const { data: layout, error } = await supabase
        .from('admin_dashboard_layouts')
        .select(SELECT_COLUMNS.admin_dashboard_layouts)
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        techDebtLogger.error('Error getting layout:', error)
        return null
      }
      
      if (layout) {
        return {
          id: layout.id,
          name: layout.name,
          layout_config: layout.layout_config,
          is_default: layout.is_default
        }
      }
      
      // Retornar layout por defecto si no existe uno personalizado
      return this.getDefaultLayout()
    } catch (error) {
      techDebtLogger.error('Error in getLayout:', error)
      return this.getDefaultLayout()
    }
  }
  
  /**
   * Guardar layout del administrador
   */
  static async saveLayout(userId: string, layout: Omit<DashboardLayout, 'id'>): Promise<DashboardLayout> {
    try {
      const supabase = await createClient()
      
      // Verificar si ya existe un layout por defecto
      const { data: existingLayout } = await supabase
        .from('admin_dashboard_layouts')
        .select('id')
        .eq('user_id', userId)
        .eq('is_default', true)
        .maybeSingle()
      
      if (existingLayout) {
        // Actualizar layout existente
        const { data: updatedLayout, error: updateError } = await supabase
          .from('admin_dashboard_layouts')
          .update({
            name: layout.name,
            layout_config: layout.layout_config,
            is_default: layout.is_default,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLayout.id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (updateError) {
          throw updateError
        }
        
        return {
          id: updatedLayout.id,
          name: updatedLayout.name,
          layout_config: updatedLayout.layout_config,
          is_default: updatedLayout.is_default
        }
      } else {
        // Crear nuevo layout
        const { data: newLayout, error: createError } = await supabase
          .from('admin_dashboard_layouts')
          .insert({
            user_id: userId,
            name: layout.name,
            layout_config: layout.layout_config,
            is_default: layout.is_default || true
          })
          .select()
          .single()
        
        if (createError) {
          throw createError
        }
        
        return {
          id: newLayout.id,
          name: newLayout.name,
          layout_config: newLayout.layout_config,
          is_default: newLayout.is_default
        }
      }
    } catch (error) {
      techDebtLogger.error('Error saving layout:', error)
      throw error
    }
  }
  
  /**
   * Restaurar layout por defecto
   */
  static async resetLayout(userId: string): Promise<void> {
    try {
      const supabase = await createClient()
      
      // Eliminar layout personalizado
      await supabase
        .from('admin_dashboard_layouts')
        .delete()
        .eq('user_id', userId)
        .eq('is_default', true)
    } catch (error) {
      techDebtLogger.error('Error resetting layout:', error)
      throw error
    }
  }
  
  /**
   * Obtener layout por defecto
   */
  private static getDefaultLayout(): DashboardLayout {
    return {
      id: null,
      name: 'Dashboard por Defecto',
      layout_config: {
        widgets: [
          { id: 'stats-cards', type: 'stats', position: { x: 0, y: 0, w: 12, h: 2 } },
          { id: 'monthly-growth', type: 'monthly-growth', position: { x: 0, y: 2, w: 6, h: 4 } },
          { id: 'content-distribution', type: 'content-distribution', position: { x: 6, y: 2, w: 6, h: 4 } },
          { id: 'recent-activity', type: 'recent-activity', position: { x: 0, y: 6, w: 12, h: 3 } }
        ]
      },
      is_default: true
    }
  }
}

