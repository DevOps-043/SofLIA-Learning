import { NextRequest, NextResponse } from 'next/server';

import { addRateLimitHeaders, checkRateLimit } from '@/core/lib/rate-limit';
import { SessionService } from '@/features/auth/services/session.service';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Json } from '@/lib/supabase/types';

import {
  liaLiveTranscriptsSchema,
  type LiaLiveTranscriptsBody,
} from './schema';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const liveTranscriptsRateLimit = {
  maxRequests: 60,
  windowMs: 60 * 1000,
  message: 'Demasiadas transcripciones de voz en vivo. Intenta nuevamente en un minuto.',
};

function getUuid(value: unknown): string | null {
  return typeof value === 'string' && UUID_PATTERN.test(value) ? value : null;
}

function getOrganizationId(pageContext: Record<string, unknown> | null | undefined): string | null {
  const directOrganizationId = getUuid(pageContext?.organizationId);
  if (directOrganizationId) return directOrganizationId;

  const lessonContext = pageContext?.currentLessonContext;
  if (!lessonContext || typeof lessonContext !== 'object' || Array.isArray(lessonContext)) {
    return null;
  }

  return getUuid((lessonContext as Record<string, unknown>).organizationId);
}

async function resolveOwnedConversationId(
  conversationId: string | undefined,
  userId: string,
): Promise<string | null> {
  if (!conversationId) return null;

  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from('lia_conversations')
    .select('conversation_id, user_id')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (error) {
    logger.warn('[lia-live] no se pudo verificar conversacion para transcript oculto', {
      conversationId,
      error,
    });
    return null;
  }

  if (!data || data.user_id !== userId) return null;
  return data.conversation_id;
}

async function handlePost(request: NextRequest, body: LiaLiveTranscriptsBody) {
  const rateLimitResult = checkRateLimit(request, liveTranscriptsRateLimit, 'lia-live-transcripts');
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  const withRateHeaders = (response: NextResponse) =>
    addRateLimitHeaders(response, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset);

  const currentUser = await SessionService.getCurrentUser();
  if (!currentUser) {
    return withRateHeaders(apiError('UNAUTHORIZED', 'No autenticado.', 401));
  }

  const supabaseAdmin = createAdminClient();
  const { data: existingSession, error: existingSessionError } = await supabaseAdmin
    .from('lia_live_sessions')
    .select('session_id, user_id')
    .eq('session_id', body.sessionId)
    .maybeSingle();

  if (existingSessionError) {
    logger.error('[lia-live] error leyendo sesion live existente', existingSessionError);
    return withRateHeaders(apiError('LIVE_TRANSCRIPT_READ_FAILED', 'No se pudo guardar la sesion de voz.', 500));
  }

  if (existingSession && existingSession.user_id !== currentUser.id) {
    return withRateHeaders(apiError('FORBIDDEN', 'No autorizado.', 403));
  }

  const conversationId = await resolveOwnedConversationId(body.conversationId, currentUser.id);
  const now = new Date().toISOString();
  const sessionRow: Database['public']['Tables']['lia_live_sessions']['Insert'] = {
    session_id: body.sessionId,
    user_id: currentUser.id,
    conversation_id: conversationId,
    organization_id: getOrganizationId(body.pageContext),
    source: body.source,
    context_type: body.contextType ?? 'general',
    model: body.model ?? null,
    language: body.language ?? null,
    outcome: body.outcome,
    started_at: body.startedAt,
    ended_at: body.endedAt,
    duration_ms: Math.round(body.durationMs),
    turn_count: body.metrics.turnCount,
    user_transcript_count: body.metrics.userTranscriptCount,
    assistant_transcript_count: body.metrics.assistantTranscriptCount,
    interruption_count: body.metrics.interruptionCount,
    error_count: body.metrics.errorCount,
    context: (body.pageContext ?? null) as Json,
    updated_at: now,
  };

  const { error: upsertSessionError } = await supabaseAdmin
    .from('lia_live_sessions')
    .upsert(sessionRow, { onConflict: 'session_id' });

  if (upsertSessionError) {
    logger.error('[lia-live] error guardando sesion live', upsertSessionError);
    return withRateHeaders(apiError('LIVE_TRANSCRIPT_SESSION_FAILED', 'No se pudo guardar la sesion de voz.', 500));
  }

  if (body.entries.length > 0) {
    const entryRows: Database['public']['Tables']['lia_live_transcript_entries']['Insert'][] =
      body.entries.map((entry) => ({
        session_id: body.sessionId,
        sequence: entry.sequence,
        role: entry.role,
        content: entry.content,
      }));

    const { error: upsertEntriesError } = await supabaseAdmin
      .from('lia_live_transcript_entries')
      .upsert(entryRows, { onConflict: 'session_id,sequence' });

    if (upsertEntriesError) {
      logger.error('[lia-live] error guardando entradas de transcript live', upsertEntriesError);
      return withRateHeaders(apiError('LIVE_TRANSCRIPT_ENTRIES_FAILED', 'No se pudo guardar la transcripcion de voz.', 500));
    }
  }

  logger.info('lia.live.transcripts', {
    source: body.source,
    outcome: body.outcome,
    sessionId: body.sessionId,
    conversationId,
    metrics: body.metrics,
  });

  return withRateHeaders(new NextResponse(null, { status: 204 }));
}

export const POST = withZodBody(liaLiveTranscriptsSchema, handlePost);
