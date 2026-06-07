import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '../../../lib/supabase/server'
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import type { Json } from '@/lib/supabase/types'

export interface AdminDashboardPreferences {
  id?: string
  user_id: string
  activity_period: '24h' | '7d' | '30d'
  growth_chart_metrics: string[]
}

type ActivityPeriod = AdminDashboardPreferences['activity_period']

function parseActivityPeriod(value: string | null): ActivityPeriod {
  return value === '7d' || value === '30d' || value === '24h'
    ? value
    : '24h'
}

function parseGrowthChartMetrics(value: Json): string[] {
  if (!Array.isArray(value)) {
    return ['users']
  }

  const metrics = value.filter((metric): metric is string => typeof metric === 'string')
  return metrics.length > 0 ? metrics : ['users']
}

function mapDashboardPreferences(preferences: {
  id: string
  user_id: string
  activity_period: string | null
  growth_chart_metrics: Json
}): AdminDashboardPreferences {
  return {
    id: preferences.id,
    user_id: preferences.user_id,
    activity_period: parseActivityPeriod(preferences.activity_period),
    growth_chart_metrics: parseGrowthChartMetrics(preferences.growth_chart_metrics)
  }
}

export class AdminDashboardPreferencesService {
  /**
   * Obtener preferencias del administrador
   */
  static async getPreferences(userId: string): Promise<AdminDashboardPreferences> {
    try {
      const supabase = await createClient()
      
      const { data: preferences, error } = await supabase
        .from('admin_dashboard_preferences')
        .select(SELECT_COLUMNS.admin_dashboard_preferences)
        .eq('user_id', userId)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') {
        techDebtLogger.error('Error getting preferences:', error)
      }
      
      if (preferences) {
        return mapDashboardPreferences(preferences)
      }
      
      // Retornar preferencias por defecto
      return {
        user_id: userId,
        activity_period: '24h',
        growth_chart_metrics: ['users']
      }
    } catch (error) {
      techDebtLogger.error('Error in getPreferences:', error)
      return {
        user_id: userId,
        activity_period: '24h',
        growth_chart_metrics: ['users']
      }
    }
  }
  
  /**
   * Guardar preferencias del administrador
   */
  static async savePreferences(userId: string, preferences: Partial<Omit<AdminDashboardPreferences, 'id' | 'user_id'>>): Promise<AdminDashboardPreferences> {
    try {
      const supabase = await createClient()
      
      // Verificar si ya existen preferencias
      const { data: existingPreferences } = await supabase
        .from('admin_dashboard_preferences')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()
      
      const preferencesData = {
        user_id: userId,
        activity_period: preferences.activity_period || '24h',
        growth_chart_metrics: preferences.growth_chart_metrics || ['users'],
        updated_at: new Date().toISOString()
      }
      
      if (existingPreferences) {
        // Actualizar preferencias existentes
        const { data: updatedPreferences, error: updateError } = await supabase
          .from('admin_dashboard_preferences')
          .update(preferencesData)
          .eq('id', existingPreferences.id)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (updateError) {
          throw updateError
        }
        
        return mapDashboardPreferences(updatedPreferences)
      } else {
        // Crear nuevas preferencias
        const { data: newPreferences, error: createError } = await supabase
          .from('admin_dashboard_preferences')
          .insert(preferencesData)
          .select()
          .single()
        
        if (createError) {
          throw createError
        }
        
        return mapDashboardPreferences(newPreferences)
      }
    } catch (error) {
      techDebtLogger.error('Error saving preferences:', error)
      throw error
    }
  }
}
