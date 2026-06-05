import 'server-only';

import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';

export const TTS_AUDIO_BUCKET = 'tts-audio';

export interface CachedAudio {
  bytes: ArrayBuffer;
  contentType: string;
}

// Reexportado para mantener una sola superficie de import en los consumidores.
// La logica pura de la clave vive en `tts-cache-key.ts` (testeable sin
// `server-only`).
export { buildTTSCacheKey } from './tts-cache-key';

export function getTTSStoragePath(key: string): string {
  return `tts/${key}`;
}

/**
 * Devuelve el audio cacheado en Supabase Storage o `null` si no existe (o si el
 * service-role no esta configurado). Nunca lanza: el cache es opcional.
 */
export async function getCachedAudio(key: string): Promise<CachedAudio | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(TTS_AUDIO_BUCKET)
      .download(getTTSStoragePath(key));

    if (error || !data) {
      return null;
    }

    const bytes = await data.arrayBuffer();
    if (bytes.byteLength === 0) {
      return null;
    }

    return { bytes, contentType: data.type || 'audio/wav' };
  } catch {
    return null;
  }
}

/**
 * Guarda el audio en el cache. Best-effort: un fallo de escritura NO debe
 * interrumpir la respuesta al usuario (que ya tiene el audio sintetizado).
 */
export async function putCachedAudio(
  key: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.storage.from(TTS_AUDIO_BUCKET).upload(getTTSStoragePath(key), bytes, {
      contentType,
      upsert: true,
    });
    if (error) {
      // Surface the real cause (e.g. file_size_limit exceeded, mime rejected) so
      // storage failures are diagnosable instead of vanishing into a false return.
      logger.warn('[tts-cache] no se pudo subir audio a Storage', {
        path: getTTSStoragePath(key),
        bytes: bytes.byteLength,
        contentType,
        error: error.message,
      });
      return false;
    }
    return true;
  } catch (error) {
    logger.warn('[tts-cache] excepcion subiendo audio a Storage', {
      path: getTTSStoragePath(key),
      bytes: bytes.byteLength,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
