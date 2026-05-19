import { NextRequest, NextResponse } from 'next/server';

import { addRateLimitHeaders, checkRateLimit } from '../../../core/lib/rate-limit';
import { isElevenLabsConfigured, synthesizeSpeechWithElevenLabs } from '../../../core/services/tts/server.service';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { textToSpeechSchema, type TextToSpeechBody } from './schema';

const ttsRateLimit = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  message: 'Demasiadas solicitudes de voz. Intenta nuevamente en un minuto.',
};

async function handlePost(
  _request: NextRequest,
  payload: TextToSpeechBody,
) {
  try {
    if (!isElevenLabsConfigured()) {
      return apiError(
        'TTS_PROVIDER_UNAVAILABLE',
        'TTS provider unavailable',
        503,
      );
    }

    const providerResponse = await synthesizeSpeechWithElevenLabs(payload);

    if (!providerResponse.ok) {
      return apiError(
        'TTS_SYNTHESIS_FAILED',
        'Unable to synthesize speech',
        502,
      );
    }

    const audio = await providerResponse.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': providerResponse.headers.get('content-type') || 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return apiError('TTS_UNEXPECTED_ERROR', 'Unexpected TTS error', 500);
  }
}

const validatedPost = withZodBody(textToSpeechSchema, handlePost);

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, ttsRateLimit, 'tts');

  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  const response = await validatedPost(request, undefined);
  return addRateLimitHeaders(
    response as NextResponse,
    rateLimitResult.limit,
    rateLimitResult.remaining,
    rateLimitResult.reset,
  );
}
