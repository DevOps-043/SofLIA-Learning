import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../lib/supabase/server'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import type { Json } from '@/lib/supabase/types'

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

type DashboardLayoutConfig = DashboardLayout['layout_config']

function isWidgetPosition(value: unknown): value is DashboardLayoutConfig['widgets'][number]['position'] {
  if (!value || typeof value !== 'object') {
    return false
  }

  const position = value as Record<string, unknown>
  return (
    typeof position.x === 'number'
    && typeof position.y === 'number'
    && typeof position.w === 'number'
    && typeof position.h === 'number'
  )
}

function parseLayoutConfig(value: Json): DashboardLayoutConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return AdminDashboardLayoutService.getDefaultLayout().layout_config
  }

  const widgets = (value as { widgets?: unknown }).widgets
  if (!Array.isArray(widgets)) {
    return AdminDashboardLayoutService.getDefaultLayout().layout_config
  }

  const parsedWidgets = widgets
    .map((widget): DashboardLayoutConfig['widgets'][number] | null => {
      if (!widget || typeof widget !== 'object' || Array.isArray(widget)) {
        return null
      }

      const candidate = widget as Record<string, unknown>
      if (
        typeof candidate.id !== 'string'
        || typeof candidate.type !== 'string'
        || !isWidgetPosition(candidate.position)
      ) {
        return null
      }

      return {
        id: candidate.id,
        type: candidate.type,
        position: candidate.position,
      }
    })
    .filter((widget): widget is DashboardLayoutConfig['widgets'][number] => widget !== null)

  return parsedWidgets.length > 0
    ? { widgets: parsedWidgets }
    : AdminDashboardLayoutService.getDefaultLayout().layout_config
}

function mapDashboardLayout(layout: {
  id: string
  name: string
  layout_config: Json
  is_default: boolean | null
}): DashboardLayout {
  return {
    id: layout.id,
    name: layout.name,
    layout_config: parseLayoutConfig(layout.layout_config),
    is_default: layout.is_default ?? false
  }
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
        return mapDashboardLayout(layout)
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
        
        return mapDashboardLayout(updatedLayout)
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
        
        return mapDashboardLayout(newLayout)
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
  static getDefaultLayout(): DashboardLayout {
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
