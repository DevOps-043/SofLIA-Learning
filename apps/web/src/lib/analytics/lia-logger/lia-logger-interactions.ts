/**
 * SofLIA Analytics Logger — Standalone analysis / helper functions
 */

import { createClient } from '../../supabase/server';
import type { LiaMessageRow } from './lia-logger-events';
import {
  conversationsTable,
  messagesTable,
  activityCompletionsTable,
  conversationAnalyticsTable,
  activityPerformanceTable,
  commonQuestionsTable,
} from './lia-logger-events';

// ============================================================================
// FUNCIONES HELPER PARA ANÁLISIS
// ============================================================================

/**
 * Obtiene estadísticas de conversaciones de un usuario
 */
export async function getUserConversationStats(userId: string) {
  const supabase = await createClient();

  const { data, error } = await conversationAnalyticsTable(supabase)
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) {
    return null;
  }

  return data;
}

/**
 * Obtiene performance de una actividad específica
 */
export async function getActivityPerformance(activityId: string) {
  const supabase = await createClient();

  const { data, error } = await activityPerformanceTable(supabase)
    .select('*')
    .eq('activity_id', activityId)
    .single();

  if (error) {
    return null;
  }

  return data;
}

/**
 * Obtiene las preguntas más frecuentes de una lección
 */
export async function getCommonQuestionsForLesson(lessonId: string, limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await commonQuestionsTable(supabase)
    .select('*')
    .eq('lesson_id', lessonId)
    .order('times_asked', { ascending: false })
    .limit(limit);

  if (error) {
    return null;
  }

  return data;
}

/**
 * Calcula métricas agregadas de LIA para el dashboard de admin
 */
export async function getLiaGlobalMetrics(startDate: Date, endDate: Date) {
  const supabase = await createClient();

  // Total de conversaciones
  const { count: totalConversations } = await conversationsTable(supabase)
    .select('*', { count: 'exact', head: true })
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  // Total de mensajes
  const { count: totalMessages } = await messagesTable(supabase)
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Actividades completadas
  const { count: completedActivities } = await activityCompletionsTable(supabase)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', startDate.toISOString())
    .lte('completed_at', endDate.toISOString());

  // Costo total
  const { data: costData } = await messagesTable(supabase)
    .select('cost_usd')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const totalCost =
    costData?.reduce((sum: number, row: LiaMessageRow) => sum + (row.cost_usd || 0), 0) || 0;

  return {
    totalConversations: totalConversations || 0,
    totalMessages: totalMessages || 0,
    completedActivities: completedActivities || 0,
    totalCostUsd: totalCost,
  };
}
