import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

import { addRateLimitHeaders, checkRateLimit } from '@/core/lib/rate-limit';
import {
  DEFAULT_LIA_LIVE_MODEL,
  DEFAULT_LIA_LIVE_VOICE,
  LIA_LIVE_LANGUAGE_CODE,
} from '@/core/services/lia-live/constants';
import { SessionService } from '@/features/auth/services/session.service';
import { withZodBody } from '@/lib/api/with-validation';
import { logger } from '@/lib/logger';

import { liaLiveTokenSchema, type LiaLiveTokenBody } from './schema';
import { buildLiaLiveSystemInstruction } from './system-instruction';

const TOKEN_USES = 1;
const SESSION_START_WINDOW_MS = 2 * 60 * 1000;
const TOKEN_EXPIRE_MS = 30 * 60 * 1000;

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

async function handlePost(request: NextRequest, body: LiaLiveTokenBody) {
  const rateLimitResult = checkRateLimit(request, liveTokenRateLimit, 'lia-live-token');
  if (!rateLimitResult.success) {
    return rateLimitResult.response!;
  }

  const withRateHeaders = (response: NextResponse) =>
    addRateLimitHeaders(response, rateLimitResult.limit, rateLimitResult.remaining, rateLimitResult.reset);

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
  const languageCode = LIA_LIVE_LANGUAGE_CODE;
  const systemInstruction = await buildLiaLiveSystemInstruction(body, currentUser);
  const now = Date.now();

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { apiVersion: 'v1alpha' } });
    const token = await ai.authTokens.create({
      config: {
        uses: TOKEN_USES,
        expireTime: new Date(now + TOKEN_EXPIRE_MS).toISOString(),
        newSessionExpireTime: new Date(now + SESSION_START_WINDOW_MS).toISOString(),
        httpOptions: { apiVersion: 'v1alpha' },
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction,
            speechConfig: {
              languageCode,
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
      throw new Error('El proveedor no devolvio un token.');
    }

    return withRateHeaders(NextResponse.json({
      token: token.name,
      model,
      systemInstruction,
      languageCode,
    }));
  } catch (error) {
    logger.error('[lia-live] error creando token efimero', error);
    return withRateHeaders(
      NextResponse.json(
        { error: 'No se pudo iniciar la voz en vivo', code: 'LIVE_TOKEN_FAILED' },
        { status: 502 },
      ),
    );
  }
}

export const POST = withZodBody(liaLiveTokenSchema, handlePost, {
  emptyBodyFallback: {},
});
