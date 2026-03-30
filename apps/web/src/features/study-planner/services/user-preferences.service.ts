/**
 * UserPreferencesService
 *
 * Handles study preferences, calendar integrations, and learning routes.
 */

import { createClient } from '../../../lib/supabase/server';
import type {
  StudyPreferences,
  CalendarIntegration,
  LearningRoute,
} from '../types/user-context.types';

export class UserPreferencesService {
  /**
   * Obtiene las preferencias de estudio del usuario
   */
  static async getStudyPreferences(userId: string): Promise<StudyPreferences | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('study_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error obteniendo preferencias de estudio:', error);
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      timezone: data.timezone,
      preferredTimeOfDay: data.preferred_time_of_day,
      preferredDays: data.preferred_days,
      dailyTargetMinutes: data.daily_target_minutes,
      weeklyTargetMinutes: data.weekly_target_minutes,
      preferredSessionType: data.preferred_session_type,
      minSessionMinutes: data.min_session_minutes,
      maxSessionMinutes: data.max_session_minutes,
      breakDurationMinutes: data.break_duration_minutes,
      calendarConnected: data.calendar_connected || false,
      calendarProvider: data.calendar_provider,
    };
  }

  /**
   * Obtiene la integración de calendario del usuario
   */
  static async getCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error obteniendo integración de calendario:', error);
      return null;
    }

    const isConnected = !!data.access_token &&
      (!data.expires_at || new Date(data.expires_at) > new Date());

    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider as 'google' | 'microsoft',
      isConnected,
      expiresAt: data.expires_at,
      scope: data.scope,
    };
  }

  /**
   * Obtiene las rutas de aprendizaje del usuario
   * NOTA: La tabla learning_routes fue eliminada - esta función retorna vacío
   * @deprecated La funcionalidad de rutas de aprendizaje ya no existe
   */
  static async getLearningRoutes(_userId: string): Promise<LearningRoute[]> {
    // La tabla learning_routes no existe, retornar array vacío sin hacer consulta
    return [];
  }
}
