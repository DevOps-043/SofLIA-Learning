import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

import { logger } from '@/lib/logger';
import { SessionService } from '@/features/auth/services/session.service';
import { addRateLimitHeaders, checkRateLimit } from '@/core/lib/rate-limit';
import {
  DEFAULT_LIA_LIVE_MODEL,
  DEFAULT_LIA_LIVE_VOICE,
  LIA_LIVE_LANGUAGE_CODE,
  LIA_LIVE_SYSTEM_INSTRUCTION,
} from '@/core/services/lia-live/constants';

// Token efímero: corta vida y un solo uso. La API key permanece en el servidor;
// el navegador abre el WebSocket a Gemini Live solo con este token.
const TOKEN_USES = 1;
const SESSION_START_WINDOW_MS = 2 * 60 * 1000; // nuevas sesiones hasta 2 min
const TOKEN_EXPIRE_MS = 30 * 60 * 1000; // duración máx. de la sesión: 30 min

const liveTokenRateLimit = {
  maxRequests: 20,
  windowMs: 60 * 1000,
  message: 'Demasiadas solicitudes de voz en vivo. Intenta de nuevo en un minuto.',
};

function resolveGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_LIVE_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    null
  );
}

function resolveLiveModel(): string {
  return process.env.GEMINI_LIVE_MODEL || DEFAULT_LIA_LIVE_MODEL;
}

function resolveLiveVoice(): string {
  return process.env.GEMINI_LIVE_VOICE || DEFAULT_LIA_LIVE_VOICE;
}

export async function POST(request: NextRequest) {
  const rateLimitResult = checkRateLimit(request, liveTokenRateLimit, 'lia-live-token');
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  const withRateHeaders = (response: NextResponse) =>
    addRateLimitHeaders(response, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset);

  // Solo usuarios autenticados pueden iniciar una sesión de voz en vivo.
  const currentUser = await SessionService.getCurrentUser();
  if (!currentUser) {
    return withRateHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }

  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    return withRateHeaders(
      NextResponse.json(
        { error: 'Voz en vivo no disponible', code: 'LIVE_PROVIDER_UNAVAILABLE' },
        { status: 503 },
      ),
    );
  }

  const model = resolveLiveModel();
  const now = Date.now();

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await ai.authTokens.create({
      config: {
        uses: TOKEN_USES,
        expireTime: new Date(now + TOKEN_EXPIRE_MS).toISOString(),
        newSessionExpireTime: new Date(now + SESSION_START_WINDOW_MS).toISOString(),
        httpOptions: { apiVersion: 'v1alpha' },
        // Bloquea el modelo y la voz: el cliente no puede cambiarlos con este token.
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: LIA_LIVE_SYSTEM_INSTRUCTION,
            speechConfig: {
              languageCode: LIA_LIVE_LANGUAGE_CODE,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: resolveLiveVoice() } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        lockAdditionalFields: [],
      },
    });

    if (!token.name) {
      throw new Error('El proveedor no devolvió un token.');
    }

    return withRateHeaders(NextResponse.json({ token: token.name, model }));
  } catch (error) {
    logger.error('[lia-live] error creando token efímero', error);
    return withRateHeaders(
      NextResponse.json(
        { error: 'No se pudo iniciar la voz en vivo', code: 'LIVE_TOKEN_FAILED' },
        { status: 502 },
      ),
    );
  }
}
