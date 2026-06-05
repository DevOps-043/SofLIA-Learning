import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addRateLimitHeaders, checkRateLimit } from '../../../core/lib/rate-limit';
import {
  DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
  DEFAULT_TTS_OUTPUT_FORMAT,
  MAX_TTS_TEXT_LENGTH,
} from '../../../core/services/tts/shared';
import { resolveTTSAudio } from '../../../core/services/tts/server/tts-synthesis.service';

const textToSpeechSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TTS_TEXT_LENGTH),
  voiceId: z.string().trim().min(1).max(128).optional(),
  modelId: z.string().trim().min(1).max(128).optional(),
  voiceSettings: z.object({
    stability: z.number().min(0).max(1),
    similarity_boost: z.number().min(0).max(1),
    style: z.number().min(0).max(1),
    use_speaker_boost: z.boolean(),
  }).optional(),
  speed: z.number().min(0.5).max(2).optional(),
  optimizeStreamingLatency: z.number().int().min(0).max(4).optional().default(DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY),
  outputFormat: z.string().trim().min(1).max(32).optional().default(DEFAULT_TTS_OUTPUT_FORMAT),
  context: z.enum(['chat', 'chat_continuation', 'reading', 'reading_continuation']).optional(),
});

// Reading uses small chunks: una reflexión larga puede producir 20+ chunks en
// menos de 60s. 80 req/min: suficiente para leer 2 actividades seguidas sin
// chocar con el límite, lo bastante ajustado para disuadir abuso.
const ttsRateLimit = {
  maxRequests: 80,
  windowMs: 60 * 1000,
  message: 'Demasiadas solicitudes de voz. Intenta nuevamente en un minuto.',
};

// El audio de lectura cacheado es inmutable (la clave es hash del contenido).
const TTS_CACHE_CONTROL = 'public, max-age=31536000, immutable';

function shouldUseBrowserFallback(result: {
  status: number;
  body: Record<string, unknown>;
}) {
  return (
    result.status >= 500 &&
    result.body.code === 'TTS_SYNTHESIS_FAILED'
  );
}

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, ttsRateLimit, 'tts');

  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  const withRateHeaders = (response: NextResponse) =>
    addRateLimitHeaders(
      response,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    );

  try {
    const payload = textToSpeechSchema.parse(await request.json());
    const result = await resolveTTSAudio(payload);

    if (result.kind === 'error') {
      if (shouldUseBrowserFallback(result)) {
        return withRateHeaders(
          new NextResponse(null, {
            status: 204,
            headers: {
              'Cache-Control': 'no-store',
              'X-TTS-Fallback': 'browser',
              'X-TTS-Error-Code': String(result.body.code || 'TTS_PROVIDER_ERROR'),
              'X-TTS-Provider': String(result.body.provider || 'unknown'),
              'X-TTS-Provider-Status': String(result.body.providerStatus || 'unknown'),
            },
          })
        );
      }

      return withRateHeaders(NextResponse.json(result.body, { status: result.status }));
    }

    return withRateHeaders(
      new NextResponse(result.bytes, {
        status: 200,
        headers: {
          'Content-Type': result.contentType,
          'Cache-Control': result.cacheStatus === 'bypass' ? 'no-store' : TTS_CACHE_CONTROL,
          'X-TTS-Cache': result.cacheStatus,
        },
      })
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withRateHeaders(
        NextResponse.json(
          { error: 'Invalid text-to-speech payload', issues: error.issues },
          { status: 400 }
        )
      );
    }

    return withRateHeaders(
      NextResponse.json(
        { error: 'Unexpected TTS error', code: 'TTS_UNEXPECTED_ERROR' },
        { status: 500 }
      )
    );
  }
}
