import 'server-only';

import type { TextToSpeechRequestPayload } from '../types';
import {
  getConfiguredTTSProvider,
  isConfiguredTTSProviderAvailable,
  resolveTTSCacheDescriptor,
  synthesizeSpeechWithConfiguredProvider,
} from '../server.service';
import { buildTTSCacheKey, getCachedAudio, putCachedAudio } from './tts-cache.service';

export type TTSCacheStatus = 'hit' | 'miss' | 'bypass';

export type TTSAudioResult =
  | {
      kind: 'audio';
      bytes: ArrayBuffer;
      contentType: string;
      cacheStatus: TTSCacheStatus;
    }
  | {
      kind: 'error';
      status: number;
      body: Record<string, unknown>;
    };

// El audio de lectura es determinista (mismo texto+voz → mismo audio) y no
// contiene datos del usuario, así que se cachea y comparte entre usuarios. El
// chat NO se cachea: puede incluir texto introducido por el usuario.
const CACHEABLE_TTS_CONTEXTS = new Set(['reading', 'reading_continuation']);

function isCacheableContext(context?: string): boolean {
  return Boolean(context && CACHEABLE_TTS_CONTEXTS.has(context));
}

async function readProviderError(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      return await response.json();
    }

    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return null;
  }
}

/**
 * Resuelve el audio TTS de un payload ya validado: intenta el caché (solo para
 * lecturas), sintetiza con el proveedor configurado si hace falta y persiste el
 * resultado (best-effort). Devuelve un resultado discriminado que la ruta HTTP
 * traduce a `NextResponse`.
 *
 * Aísla la orquestación (caché + síntesis + errores de proveedor) del
 * transporte HTTP (rate limiting, parsing, cabeceras), que vive en la ruta.
 */
export async function resolveTTSAudio(
  payload: TextToSpeechRequestPayload,
): Promise<TTSAudioResult> {
  if (!isConfiguredTTSProviderAvailable()) {
    return {
      kind: 'error',
      status: 503,
      body: {
        error: 'TTS provider unavailable',
        code: 'TTS_PROVIDER_UNAVAILABLE',
        provider: getConfiguredTTSProvider(),
      },
    };
  }

  const cacheKey = isCacheableContext(payload.context)
    ? buildTTSCacheKey(resolveTTSCacheDescriptor(payload), payload.text)
    : null;

  if (cacheKey) {
    const cached = await getCachedAudio(cacheKey);
    if (cached) {
      return {
        kind: 'audio',
        bytes: cached.bytes,
        contentType: cached.contentType,
        cacheStatus: 'hit',
      };
    }
  }

  const { provider, response: providerResponse } =
    await synthesizeSpeechWithConfiguredProvider(payload);

  if (!providerResponse.ok) {
    const providerError = await readProviderError(providerResponse);
    console.error('TTS synthesis failed', {
      provider,
      status: providerResponse.status,
      statusText: providerResponse.statusText,
      error: providerError,
    });

    return {
      kind: 'error',
      status: 502,
      body: {
        error: 'Unable to synthesize speech',
        code: 'TTS_SYNTHESIS_FAILED',
        provider,
        providerStatus: providerResponse.status,
      },
    };
  }

  const bytes = await providerResponse.arrayBuffer();
  const contentType = providerResponse.headers.get('content-type') || 'audio/mpeg';

  // Guardamos en caché (best-effort) antes de responder: las próximas
  // reproducciones —de cualquier usuario— serán instantáneas.
  if (cacheKey) {
    await putCachedAudio(cacheKey, bytes, contentType);
  }

  return {
    kind: 'audio',
    bytes,
    contentType,
    cacheStatus: cacheKey ? 'miss' : 'bypass',
  };
}
