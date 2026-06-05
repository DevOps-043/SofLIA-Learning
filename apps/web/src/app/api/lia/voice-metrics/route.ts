import { NextRequest, NextResponse } from 'next/server';

import { addRateLimitHeaders, checkRateLimit } from '@/core/lib/rate-limit';
import { withZodBody } from '@/lib/api/with-validation';
import { logger } from '@/lib/logger';

import {
  liaVoiceMetricsSchema,
  type LiaVoiceMetricsBody,
} from './schema';

const voiceMetricsRateLimit = {
  maxRequests: 120,
  windowMs: 60 * 1000,
  message: 'Demasiadas metricas de voz. Intenta nuevamente en un minuto.',
};

async function handlePost(request: NextRequest, body: LiaVoiceMetricsBody) {
  const rateLimitResult = checkRateLimit(request, voiceMetricsRateLimit, 'lia-voice-metrics');

  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  logger.info('lia.voice.metrics', {
    source: body.source,
    outcome: body.outcome,
    schemaVersion: body.schemaVersion,
    recordedAt: body.recordedAt,
    messageId: body.messageId,
    metrics: body.metrics,
  });

  return addRateLimitHeaders(
    new NextResponse(null, { status: 204 }),
    rateLimitResult.limit,
    rateLimitResult.remaining,
    rateLimitResult.reset,
  );
}

export const POST = withZodBody(liaVoiceMetricsSchema, handlePost);
