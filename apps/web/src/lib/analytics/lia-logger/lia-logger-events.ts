/**
 * SofLIA Analytics Logger — Event types, interfaces, and table helpers
 *
 * NOTA: Este archivo usa tablas `lia_*` fuera del esquema generado de Supabase.
 * Se tipan de forma local mientras se regeneran los contratos oficiales.
 */

import { fromLoose } from '../../supabase/looseQuery';
import type { CourseLessonContext } from '../../../core/types/lia.types';

// ============================================================================
// TIPOS PÚBLICOS
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
  generatedOutput?: unknown;
}

// ============================================================================
// TIPOS INTERNOS (filas de base de datos)
// ============================================================================

export interface LiaConversationRow {
  conversation_id: string;
  started_at?: string | null;
  total_messages?: number | null;
  total_lia_messages?: number | null;
}

export interface LiaMessageRow {
  message_id: string;
  message_sequence?: number | null;
  cost_usd?: number | null;
}

export interface LiaActivityCompletionRow {
  completion_id: string;
  started_at?: string | null;
  total_steps?: number | null;
  lia_had_to_redirect?: number | null;
}

export type LooseWriteRow = Record<string, unknown>;

// ============================================================================
// TABLE HELPERS
// ============================================================================

export function conversationsTable(client: unknown) {
  return fromLoose<LiaConversationRow, LooseWriteRow>(client, 'lia_conversations');
}

export function messagesTable(client: unknown) {
  return fromLoose<LiaMessageRow, LooseWriteRow>(client, 'lia_messages');
}

export function activityCompletionsTable(client: unknown) {
  return fromLoose<LiaActivityCompletionRow, LooseWriteRow>(
    client,
    'lia_activity_completions'
  );
}

export function userFeedbackTable(client: unknown) {
  return fromLoose<Record<string, unknown>, LooseWriteRow>(client, 'lia_user_feedback');
}

export function conversationAnalyticsTable(client: unknown) {
  return fromLoose<Record<string, unknown>>(client, 'lia_conversation_analytics');
}

export function activityPerformanceTable(client: unknown) {
  return fromLoose<Record<string, unknown>>(client, 'lia_activity_performance');
}

export function commonQuestionsTable(client: unknown) {
  return fromLoose<Record<string, unknown>>(client, 'lia_common_questions');
}
