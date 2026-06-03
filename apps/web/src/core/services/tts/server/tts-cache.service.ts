import 'server-only';

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
    return !error;
  } catch {
    // El cache es opcional; ignoramos errores de escritura.
    return false;
  }
}
