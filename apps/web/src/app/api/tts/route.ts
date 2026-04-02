import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addRateLimitHeaders, checkRateLimit } from '../../../core/lib/rate-limit';
import {
  DEFAULT_ELEVENLABS_MODEL_ID,
  DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY,
  DEFAULT_TTS_OUTPUT_FORMAT,
  MAX_TTS_TEXT_LENGTH,
} from '../../../core/services/tts/shared';
import { isElevenLabsConfigured, synthesizeSpeechWithElevenLabs } from '../../../core/services/tts/server.service';

const textToSpeechSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TTS_TEXT_LENGTH),
  voiceId: z.string().trim().min(1).max(128).optional(),
  modelId: z.string().trim().min(1).max(128).optional().default(DEFAULT_ELEVENLABS_MODEL_ID),
  voiceSettings: z.object({
    stability: z.number().min(0).max(1),
    similarity_boost: z.number().min(0).max(1),
    style: z.number().min(0).max(1),
    use_speaker_boost: z.boolean(),
  }).optional(),
  speed: z.number().min(0.5).max(2).optional(),
  optimizeStreamingLatency: z.number().int().min(0).max(4).optional().default(DEFAULT_TTS_OPTIMIZE_STREAMING_LATENCY),
  outputFormat: z.string().trim().min(1).max(32).optional().default(DEFAULT_TTS_OUTPUT_FORMAT),
});

const ttsRateLimit = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  message: 'Demasiadas solicitudes de voz. Intenta nuevamente en un minuto.',
};

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, ttsRateLimit, 'tts');

  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  try {
    const payload = textToSpeechSchema.parse(await request.json());

    if (!isElevenLabsConfigured()) {
      return addRateLimitHeaders(
        NextResponse.json(
          {
            error: 'TTS provider unavailable',
            code: 'TTS_PROVIDER_UNAVAILABLE',
          },
          { status: 503 }
        ),
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset
      );
    }

    const providerResponse = await synthesizeSpeechWithElevenLabs(payload);

    if (!providerResponse.ok) {
      return addRateLimitHeaders(
        NextResponse.json(
          {
            error: 'Unable to synthesize speech',
            code: 'TTS_SYNTHESIS_FAILED',
          },
          { status: 502 }
        ),
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset
      );
    }

    const audio = await providerResponse.arrayBuffer();
    const response = new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': providerResponse.headers.get('content-type') || 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });

    return addRateLimitHeaders(response, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return addRateLimitHeaders(
        NextResponse.json(
          {
            error: 'Invalid text-to-speech payload',
            issues: error.issues,
          },
          { status: 400 }
        ),
        rateLimitResult.limit,
        rateLimitResult.remaining,
        rateLimitResult.reset
      );
    }

    return addRateLimitHeaders(
      NextResponse.json(
        {
          error: 'Unexpected TTS error',
          code: 'TTS_UNEXPECTED_ERROR',
        },
        { status: 500 }
      ),
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    );
  }
}
