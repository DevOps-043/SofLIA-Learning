/**
 * SofLIA Analytics Logger
 * 
 * Sistema de logging para interacciones con SofLIA que permite:
 * - Rastrear conversaciones completas
 * - Analizar mensajes individuales
 * - Calcular métricas de uso y calidad
 * - Facilitar minería de datos
 * 
 * NOTA: Este archivo usa 'as any' porque las tablas lia_* no están en los tipos generados de Supabase.
 * Los tipos se generarán automáticamente cuando se ejecute el comando de regeneración de tipos.
 */

import { createClient } from '../supabase/server';
import type { CourseLessonContext } from '../../core/types/lia.types';

// ============================================================================
// TIPOS
// ============================================================================

export type ContextType = 'course' | 'general' | 'workshop' | 'community' | 'news';
export type MessageRole = 'user' | 'assistant' | 'system';
export type ActivityStatus = 'started' | 'in_progress' | 'completed' | 'abandoned';

export interface ConversationMetadata {
  contextType: ContextType;
  courseContext?: CourseLessonContext;
  deviceType?: string;
  browser?: string;
  ipAddress?: string;
}

export interface MessageMetadata {
  modelUsed?: string;
  tokensUsed?: number;
  costUsd?: number;
  responseTimeMs?: number;
}

export interface ActivityProgress {
  totalSteps: number;
  completedSteps: number;
  currentStep: number;
  generatedOutput?: any;
}

// ============================================================================
// CLASE PRINCIPAL: LiaLogger
// ============================================================================

export class SofLIALogger {
  private userId: string;
  private conversationId: string | null = null;
  private messageSequence: number = 0; // Contador de secuencia de mensajes

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Inicia una nueva conversación con SofLIA
   * IMPORTANTE: Limita a máximo 5 conversaciones por usuario por contexto
   * Elimina automáticamente las conversaciones más antiguas si se excede el límite
   */
  async startConversation(metadata: ConversationMetadata): Promise<string> {
    const supabase = await createClient();

    // Límite de conversaciones por usuario por contexto
    const MAX_CONVERSATIONS_PER_CONTEXT = 5;

    // Verificar cuántas conversaciones tiene el usuario para este contexto
    const { data: existingConversations, error: countError } = await supabase
      .from('lia_conversations' as any)
      .select('conversation_id, started_at')
      .eq('user_id', this.userId)
      .eq('context_type', metadata.contextType)
      .order('started_at', { ascending: false });

    if (!countError && existingConversations && existingConversations.length >= MAX_CONVERSATIONS_PER_CONTEXT) {
      // Eliminar las conversaciones más antiguas (mantener solo las 4 más recientes)
      const conversationsToDelete = existingConversations.slice(MAX_CONVERSATIONS_PER_CONTEXT - 1);
      const conversationIdsToDelete = conversationsToDelete.map((conv: any) => conv.conversation_id);

      if (conversationIdsToDelete.length > 0) {
        // Primero eliminar los mensajes de esas conversaciones
        await supabase
          .from('lia_messages' as any)
          .delete()
          .in('conversation_id', conversationIdsToDelete);

        // Luego eliminar las conversaciones
        await supabase
          .from('lia_conversations' as any)
          .delete()
          .in('conversation_id', conversationIdsToDelete);
      }
    }

    const { data, error } = await supabase
      .from('lia_conversations' as any)
      .insert({
        user_id: this.userId,
        context_type: metadata.contextType,
        course_id: metadata.courseContext?.courseId || null,
        module_id: metadata.courseContext?.moduleId || null,
        lesson_id: metadata.courseContext?.lessonId || null,
        activity_id: null, // Se vinculará cuando se incie una actividad específica
        device_type: metadata.deviceType || null,
        browser: metadata.browser || null,
        ip_address: metadata.ipAddress || null,
      } as any)
      .select('conversation_id')
      .single();

    if (error) {
      console.error('[SofLIALogger] Error starting conversation:', error);
      throw error;
    }

    this.conversationId = (data as any)?.conversation_id || null;
    this.messageSequence = 0; // Reset secuencia para nueva conversación
    return this.conversationId!
  }

  /**
   * Registra un mensaje en la conversación actual
   * Guarda tokens, costo, modelo y tiempo de respuesta
   */
  async logMessage(
    role: MessageRole,
    content: string,
    isSystemMessage: boolean = false,
    metadata?: MessageMetadata
  ): Promise<string> {
    if (!this.conversationId) {
      throw new Error('No active conversation. Call startConversation first.');
    }

    const supabase = await createClient();

    // Incrementar secuencia de mensajes
    this.messageSequence++;

    // Usar INSERT directo para mayor confiabilidad
    const { data, error } = await supabase
      .from('lia_messages' as any)
      .insert({
        conversation_id: this.conversationId,
        role: role,
        content: content,
        is_system_message: isSystemMessage,
        model_used: metadata?.modelUsed || null,
        tokens_used: metadata?.tokensUsed || null,
        cost_usd: metadata?.costUsd || null,
        response_time_ms: metadata?.responseTimeMs || null,
        message_sequence: this.messageSequence, // ✅ Campo requerido
        created_at: new Date().toISOString()
      } as any)
      .select('message_id')
      .single();

    if (error) {
      // Si es error de FK (23503), la conversación fue eliminada - limpiar estado
      if (error.code === '23503') {
        this.conversationId = null;
        this.messageSequence = 0;
        return ''; // Retornar vacío sin loggear error
      }
      console.error('[SofLIALogger] Error logging message:', error);
      throw error;
    }

    // Actualizar contadores en la conversación
    try {
      // Obtener contadores actuales
      const { data: convData } = await supabase
        .from('lia_conversations' as any)
        .select('total_messages, total_lia_messages')
        .eq('conversation_id', this.conversationId)
        .single();

      if (convData) {
        const updates: any = {
          total_messages: (convData.total_messages || 0) + 1
        };

        if (role === 'assistant') {
          updates.total_lia_messages = (convData.total_lia_messages || 0) + 1;
        }

        await supabase
          .from('lia_conversations' as any)
          .update(updates)
          .eq('conversation_id', this.conversationId);
      }
    } catch (updateError) {
      // Ignorar errores de actualización de contadores, no son críticos
    }

    return (data as any)?.message_id;
  }

  /**
   * Cierra la conversación actual
   */
  async endConversation(completed: boolean = true): Promise<void> {
    if (!this.conversationId) {
      return;
    }

    const supabase = await createClient();

    // Usar UPDATE directo para mayor confiabilidad
    const { error } = await supabase
      .from('lia_conversations' as any)
      .update({
        ended_at: new Date().toISOString(),
        is_completed: completed
      } as any)
      .eq('conversation_id', this.conversationId);

    if (error) {
      // console.error('Error ending conversation:', error);
      throw error;
    }

    this.conversationId = null;
  }

  /**
   * Registra el inicio de una actividad interactiva
   */
  async startActivity(
    activityId: string,
    totalSteps: number
  ): Promise<string> {
    if (!this.conversationId) {
      throw new Error('No active conversation. Call startConversation first.');
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('lia_activity_completions' as any)
      .insert({
        conversation_id: this.conversationId,
        user_id: this.userId,
        activity_id: activityId,
        status: 'started',
        total_steps: totalSteps,
        current_step: 1,
      } as any)
      .select('completion_id')
      .single();

    if (error) {
      // console.error('Error starting activity:', error);
      throw error;
    }

    return (data as any).completion_id;
  }

  /**
   * Actualiza el progreso de una actividad
   */
  async updateActivityProgress(
    completionId: string,
    progress: Partial<ActivityProgress> & { status?: ActivityStatus }
  ): Promise<void> {
    const supabase = await createClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (progress.completedSteps !== undefined) {
      updateData.completed_steps = progress.completedSteps;
    }
    if (progress.currentStep !== undefined) {
      updateData.current_step = progress.currentStep;
    }
    if (progress.totalSteps !== undefined) {
      updateData.total_steps = progress.totalSteps;
    }
    if (progress.generatedOutput !== undefined) {
      updateData.generated_output = progress.generatedOutput;
    }
    if (progress.status !== undefined) {
      updateData.status = progress.status;

      if (progress.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }

    const { error } = await supabase
      .from('lia_activity_completions' as any)
      .update(updateData)
      .eq('completion_id', completionId);

    if (error) {
      // console.error('Error updating activity progress:', error);
      throw error;
    }
  }

  /**
   * Completa una actividad
   */
  async completeActivity(
    completionId: string,
    generatedOutput?: any
  ): Promise<void> {
    const supabase = await createClient();

    // Primero obtener la actividad para calcular tiempo
    const { data: activity } = await supabase
      .from('lia_activity_completions' as any)
      .select('started_at, total_steps')
      .eq('completion_id', completionId)
      .single();

    if (!activity) {
      throw new Error('Activity not found');
    }

    const timeToComplete = Math.floor(
      (new Date().getTime() - new Date(activity.started_at).getTime()) / 1000
    );

    const { error } = await supabase
      .from('lia_activity_completions' as any)
      .update({
        status: 'completed',
        completed_steps: activity.total_steps,
        completed_at: new Date().toISOString(),
        time_to_complete_seconds: timeToComplete,
        generated_output: generatedOutput || null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('completion_id', completionId);

    if (error) {
      // console.error('Error completing activity:', error);
      throw error;
    }
  }

  /**
   * Marca una actividad como abandonada
   */
  async abandonActivity(completionId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('lia_activity_completions' as any)
      .update({
        status: 'abandoned',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('completion_id', completionId);

    if (error) {
      // console.error('Error abandoning activity:', error);
      throw error;
    }
  }

  /**
   * Registra feedback del usuario sobre un mensaje de SofLIA
   */
  async logFeedback(
    messageId: string,
    feedbackType: 'helpful' | 'not_helpful' | 'incorrect' | 'confusing',
    rating?: number,
    comment?: string
  ): Promise<void> {
    if (!this.conversationId) {
      throw new Error('No active conversation.');
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from('lia_user_feedback' as any)
      .insert({
        message_id: messageId,
        conversation_id: this.conversationId,
        user_id: this.userId,
        feedback_type: feedbackType,
        rating: rating || null,
        comment: comment || null,
      } as any);

    if (error) {
      // console.error('Error logging feedback:', error);
      throw error;
    }
  }

  /**
   * Incrementa el contador de redirecciones en una actividad
   */
  async incrementRedirections(completionId: string): Promise<void> {
    const supabase = await createClient();

    // Obtener valor actual
    const { data } = await supabase
      .from('lia_activity_completions' as any)
      .select('lia_had_to_redirect')
      .eq('completion_id', completionId)
      .single();

    if (!data) return;

    // Incrementar
    const { error } = await supabase
      .from('lia_activity_completions' as any)
      .update({
        lia_had_to_redirect: (data.lia_had_to_redirect || 0) + 1,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('completion_id', completionId);

    if (error) {
      console.error('[SofLIALogger] Error incrementing redirections:', error);
    }
  }

  /**
   * Obtiene el ID de la conversación actual
   */
  getCurrentConversationId(): string | null {
    return this.conversationId;
  }

  /**
   * Establece manualmente un conversation_id (útil para recuperar sesiones)
   */
  setConversationId(conversationId: string): void {
    this.conversationId = conversationId;
    this.messageSequence = 0; // Reset, se debe llamar recoverMessageSequence después
  }

  /**
   * Recupera la secuencia de mensajes de una conversación existente
   * Debe llamarse después de setConversationId para continuar correctamente
   */
  async recoverMessageSequence(): Promise<void> {
    if (!this.conversationId) return;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('lia_messages' as any)
      .select('message_sequence')
      .eq('conversation_id', this.conversationId)
      .order('message_sequence', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[LiaLogger] Error recovering message sequence:', error);
    }

    this.messageSequence = data?.message_sequence || 0;

  }

  /**
   * Obtiene la secuencia actual de mensajes
   */
  getCurrentMessageSequence(): number {
    return this.messageSequence;
  }
}

// ============================================================================
// FUNCIONES HELPER PARA ANÁLISIS
// ============================================================================

/**
 * Obtiene estadísticas de conversaciones de un usuario
 */
export async function getUserConversationStats(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lia_conversation_analytics' as any)
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) {
    // console.error('Error fetching user stats:', error);
    return null;
  }

  return data;
}

/**
 * Obtiene performance de una actividad específica
 */
export async function getActivityPerformance(activityId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lia_activity_performance' as any)
    .select('*')
    .eq('activity_id', activityId)
    .single();

  if (error) {
    // console.error('Error fetching activity performance:', error);
    return null;
  }

  return data;
}

/**
 * Obtiene las preguntas más frecuentes de una lección
 */
export async function getCommonQuestionsForLesson(lessonId: string, limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('lia_common_questions' as any)
    .select('*')
    .eq('lesson_id', lessonId)
    .order('times_asked', { ascending: false })
    .limit(limit);

  if (error) {
    // console.error('Error fetching common questions:', error);
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
  const { count: totalConversations } = await supabase
    .from('lia_conversations' as any)
    .select('*', { count: 'exact', head: true })
    .gte('started_at', startDate.toISOString())
    .lte('started_at', endDate.toISOString());

  // Total de mensajes
  const { count: totalMessages } = await supabase
    .from('lia_messages' as any)
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  // Actividades completadas
  const { count: completedActivities } = await supabase
    .from('lia_activity_completions' as any)
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', startDate.toISOString())
    .lte('completed_at', endDate.toISOString());

  // Costo total
  const { data: costData } = await supabase
    .from('lia_messages' as any)
    .select('cost_usd')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const totalCost = costData?.reduce((sum, row) => sum + (row.cost_usd || 0), 0) || 0;

  return {
    totalConversations: totalConversations || 0,
    totalMessages: totalMessages || 0,
    completedActivities: completedActivities || 0,
    totalCostUsd: totalCost,
  };
}

