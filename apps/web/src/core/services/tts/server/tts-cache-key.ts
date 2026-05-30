import { createHash } from 'crypto';
import { TTS_PROMPT_VERSION } from '../shared';
import type { TTSCacheDescriptor } from '../server.service';

/**
 * Clave determinista del audio sintetizado. El audio es función pura de
 * (versión de prompt, proveedor, voz, modelo, contexto, texto): el mismo input
 * produce siempre el mismo audio, por lo que puede cachearse y compartirse
 * entre usuarios.
 *
 * Función pura (sin I/O ni `server-only`) para poder testearla de forma aislada.
 */
export function buildTTSCacheKey(
  descriptor: TTSCacheDescriptor,
  text: string,
): string {
  const raw = [
    TTS_PROMPT_VERSION,
    descriptor.provider,
    descriptor.voice,
    descriptor.model,
    descriptor.context,
    text,
  ].join(' ');

  return createHash('sha256').update(raw).digest('hex');
}
