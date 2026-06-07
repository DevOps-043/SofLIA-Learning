import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Modality } from '@google/genai';

import { addRateLimitHeaders, checkRateLimit } from '@/core/lib/rate-limit';
import {
  DEFAULT_LIA_LIVE_MODEL,
  DEFAULT_LIA_LIVE_VOICE,
  LIA_LIVE_LANGUAGE_CODE,
  isNativeAudioLiveModel,
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

/** Lee una env var y la normaliza: recorta espacios/saltos de linea que se
 * cuelan al pegar valores en paneles como Netlify y rompen la autenticacion. */
function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Usa la MISMA API key de Gemini que el resto de SofLIA (chat, TTS, traduccion):
 * `GOOGLE_API_KEY` con `GEMINI_API_KEY` como respaldo. No se usa una key
 * dedicada de voz en vivo para evitar configurar/rotar claves extra y para que
 * una `GEMINI_LIVE_API_KEY` mal configurada no rompa esta ruta. El `.trim()`
 * evita el fallo "misma key pero 401" por espacios/saltos invisibles.
 */
function resolveGeminiApiKey(): string | null {
  return readEnv('GOOGLE_API_KEY') || readEnv('GEMINI_API_KEY') || null;
}

function resolveLiveModel(): string {
  return readEnv('GEMINI_LIVE_MODEL') || DEFAULT_LIA_LIVE_MODEL;
}

function resolveLiveVoice(): string {
  return readEnv('GEMINI_LIVE_VOICE') || DEFAULT_LIA_LIVE_VOICE;
}

/**
 * Diagnostico SEGURO (sin secretos) para entender, desde la respuesta o los
 * logs, por que el minado del token falla en un entorno y no en otro. Reporta
 * solo presencia (booleans) de variables que el SDK `@google/genai` usa para
 * autodetectar Vertex AI, y metadatos no sensibles de la API key.
 */
function buildLiveTokenDiagnostics(apiKey: string | null) {
  return {
    // Si alguno es true y aun asi falla con vertexai:false, el modo Vertex
    // NO es la causa. Si todos son false, Vertex queda descartado de entrada.
    vertexEnv: {
      USE_VERTEXAI: Boolean(process.env.GOOGLE_GENAI_USE_VERTEXAI),
      GOOGLE_CLOUD_PROJECT: Boolean(process.env.GOOGLE_CLOUD_PROJECT),
      GCLOUD_PROJECT: Boolean(process.env.GCLOUD_PROJECT),
      GOOGLE_CLOUD_LOCATION: Boolean(process.env.GOOGLE_CLOUD_LOCATION),
      GOOGLE_APPLICATION_CREDENTIALS: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    },
    // Metadatos no sensibles: solo presencia y longitud para detectar key
    // vacia, truncada o con espacios invisibles sin exponer identificadores.
    apiKey: {
      present: Boolean(apiKey),
      length: apiKey ? apiKey.length : 0,
    },
  };
}

/**
 * Extrae el estado HTTP y el mensaje del proveedor (Gemini) desde un error
 * desconocido sin exponer stack traces ni secretos. El SDK `@google/genai`
 * lanza `ApiError` con `status` (numero) y `message`; otros errores se
 * degradan a un texto plano.
 */
function describeProviderError(error: unknown): { status?: number; message: string } {
  if (error && typeof error === 'object') {
    const candidate = error as { status?: unknown; code?: unknown; message?: unknown };
    const status =
      typeof candidate.status === 'number'
        ? candidate.status
        : typeof candidate.code === 'number'
        ? candidate.code
        : undefined;
    const message =
      typeof candidate.message === 'string' && candidate.message.trim()
        ? candidate.message
        : 'Error desconocido del proveedor de voz en vivo.';
    return { status, message };
  }

  return { message: typeof error === 'string' ? error : 'Error desconocido del proveedor de voz en vivo.' };
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
  const voiceName = resolveLiveVoice();
  const systemInstruction = await buildLiaLiveSystemInstruction(body, currentUser);
  const now = Date.now();
  const speechConfig = isNativeAudioLiveModel(model)
    ? { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
    : { languageCode, voiceConfig: { prebuiltVoiceConfig: { voiceName } } };

  try {
    // `vertexai: false` fuerza el modo Gemini Developer API (autenticacion por
    // API key). Sin esto, el SDK `@google/genai` autodetecta el entorno y, si
    // encuentra variables de Google Cloud (GOOGLE_GENAI_USE_VERTEXAI,
    // GOOGLE_APPLICATION_CREDENTIALS, GOOGLE_CLOUD_PROJECT...), cambia a modo
    // Vertex AI, ignora `apiKey` e intenta usar credenciales OAuth/ADC -> 401.
    // Esto ocurria en Netlify (con env de OAuth) pero no en local.
    const ai = new GoogleGenAI({ apiKey, vertexai: false, httpOptions: { apiVersion: 'v1alpha' } });
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
            speechConfig,
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
      voiceName,
    }));
  } catch (error) {
    const providerError = describeProviderError(error);
    const diagnostics = buildLiveTokenDiagnostics(apiKey);
    logger.error('[lia-live] error creando token efimero', {
      providerStatus: providerError.status,
      providerMessage: providerError.message,
      model,
      diagnostics,
    });
    return withRateHeaders(
      NextResponse.json(
        {
          error: 'No se pudo iniciar la voz en vivo',
          code: 'LIVE_TOKEN_FAILED',
          // Diagnostico del proveedor (Gemini): el mensaje de error de la API
          // no contiene la API key ni secretos, pero si la causa real
          // (p. ej. 403 = la key no tiene acceso a Live/tokens efimeros,
          // 404 = modelo inexistente, 429 = cuota agotada).
          providerStatus: providerError.status,
          detail: providerError.message,
          // Solo presencia/booleans y metadatos no sensibles. Ver helper.
          diagnostics,
        },
        { status: 502 },
      ),
    );
  }
}

export const POST = withZodBody(liaLiveTokenSchema, handlePost, {
  emptyBodyFallback: {},
});
