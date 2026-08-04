import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/requireUser';
import { addRateLimitHeaders, checkRateLimit } from '../../../core/lib/rate-limit';
import {
  MAX_TTS_SPEED,
  MAX_TTS_TEXT_LENGTH,
  MIN_TTS_SPEED,
  TTS_LANGUAGES,
} from '../../../core/services/tts/shared';
import { resolveTTSAudio } from '../../../core/services/tts/server/tts-synthesis.service';

// La voz, el modelo y el formato de salida los decide el SERVIDOR: no son parte
// del contrato. Si el cliente pudiera elegirlos, cualquiera podría sintetizar con
// voces o modelos arbitrarios a cargo de la cuota de pago de la plataforma, y la
// identidad sonora de SofLIA dejaría de ser consistente entre superficies.
const textToSpeechSchema = z.object({
  text: z.string().trim().min(1).max(MAX_TTS_TEXT_LENGTH),
  voiceSettings: z.object({
    stability: z.number().min(0).max(1),
    similarity_boost: z.number().min(0).max(1),
    // Opcionales: los modelos en uso los ignoran (ver `ElevenLabsVoiceSettings`).
    style: z.number().min(0).max(1).optional(),
    use_speaker_boost: z.boolean().optional(),
  }).optional(),
  // Rango impuesto por ElevenLabs: fuera de 0.7–1.2 el proveedor responde 400.
  speed: z.number().min(MIN_TTS_SPEED).max(MAX_TTS_SPEED).optional(),
  context: z.enum(['chat', 'chat_continuation', 'reading', 'reading_continuation']).optional(),
  language: z.enum(TTS_LANGUAGES).optional(),
  // Solo contexto de prosodia: no se sintetiza, así que basta con acotarlo para
  // que no infle el cuerpo de la petición.
  previousText: z.string().trim().max(MAX_TTS_TEXT_LENGTH).optional(),
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

  // Autenticacion DESPUES del rate limit: cada sintesis consume cuota de un
  // proveedor de pago, asi que la voz solo esta disponible para usuarios con
  // sesion. Todas las superficies que locutan (panel lateral, SofLIA en cursos y
  // el onboarding en /dashboard) viven en rutas autenticadas, de modo que el
  // gate no degrada ningun flujo existente.
  const auth = await requireUser();
  if (auth instanceof NextResponse) {
    return withRateHeaders(auth);
  }

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
