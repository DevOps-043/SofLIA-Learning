import { findFirstSpeakableBoundary } from './streaming-speech-player';

// Trocea texto para síntesis de voz con tamaño ADAPTATIVO: el primer fragmento
// es corto (arranque rápido → baja el "time-to-first-audio") y los siguientes
// son mayores (menos cortes de prosodia y menos peticiones). Función pura.

const DEFAULT_FIRST_CHUNK_CHARS = 160;
const DEFAULT_REST_CHUNK_CHARS = 420;

interface ChunkSpeechOptions {
  firstChunkChars?: number;
  restChunkChars?: number;
}

function hardSplitLongSentence(sentence: string, maxLen: number): string[] {
  const parts = sentence.split(/(?<=,)\s+/);
  const out: string[] = [];
  let current = '';
  for (const part of parts) {
    if (current && current.length + 1 + part.length > maxLen) {
      out.push(current);
      current = part;
    } else {
      current = current ? `${current} ${part}` : part;
    }
  }
  if (current) out.push(current);
  return out;
}

export function chunkSpeechText(text: string, options: ChunkSpeechOptions = {}): string[] {
  const firstChunkChars = options.firstChunkChars ?? DEFAULT_FIRST_CHUNK_CHARS;
  const restChunkChars = options.restChunkChars ?? DEFAULT_REST_CHUNK_CHARS;

  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';
  // El límite depende de si ya emitimos el primer fragmento (arranque rápido).
  const limitFor = () => (chunks.length === 0 ? firstChunkChars : restChunkChars);

  for (const sentence of sentences) {
    const maxLen = limitFor();
    if (sentence.length > maxLen) {
      if (current) { chunks.push(current); current = ''; }
      chunks.push(...hardSplitLongSentence(sentence, limitFor()));
      continue;
    }

    const addLen = current ? 1 + sentence.length : sentence.length;
    if (current && current.length + addLen > maxLen) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

/**
 * Política de troceo para la voz en STREAMING de SofLIA, compartida por las dos
 * vías de voz en vivo (panel lateral `useLiaSidePanelVoice` y panel embebido
 * `useStreamingChatVoice`). Centralizar esto evita la duplicación que antes
 * mantenía el MISMO bug en ambos: el texto restante de una respuesta larga se
 * enviaba como un único fragmento que excedía el límite del endpoint TTS y se
 * cortaba el audio. Con estos helpers, toda la respuesta se trocea por oración
 * con un tope de tamaño seguro, sin importar lo larga que sea.
 */

/**
 * El PRIMER fragmento arranca con una cláusula corta para minimizar el desfase
 * inicial texto↔voz; el resto se corta por oración completa para sonar natural.
 */
const STREAM_FIRST_BOUNDARY = { minChars: 12, softCap: 56 };
const STREAM_REST_BOUNDARY = { minChars: 80, softCap: 220 };

/**
 * Tope DURO de caracteres por fragmento TTS en streaming. Se mantiene muy por
 * debajo de `MAX_TTS_TEXT_LENGTH` (4000) del endpoint `/api/tts` para que un
 * único fragmento nunca sea rechazado con 400 ni dispare timeouts de síntesis
 * por un payload gigante (causa raíz del audio cortado en respuestas largas).
 */
export const MAX_SPEECH_CHUNK_CHARS = 600;

/**
 * Cuántos fragmentos sintetizados por delante de la reproducción toleramos
 * mientras el texto AÚN llega en streaming. Mantiene el audio fluido sin
 * pre-sintetizar toda la respuesta (la síntesis ya tiene su propio backpressure).
 */
export const STREAM_LOOKAHEAD_CHUNKS = 3;

function streamBoundaryConfig(isFirstChunk: boolean) {
  return isFirstChunk ? STREAM_FIRST_BOUNDARY : STREAM_REST_BOUNDARY;
}

/**
 * Acota `length` al tope duro cortando en el último espacio dentro del límite
 * (para no partir una palabra). Si no hay un espacio razonable, corta en seco.
 */
function clampToMaxChars(text: string, length: number): number {
  if (length <= MAX_SPEECH_CHUNK_CHARS) return length;
  const lastSpace = text.lastIndexOf(' ', MAX_SPEECH_CHUNK_CHARS);
  return lastSpace > MAX_SPEECH_CHUNK_CHARS / 2 ? lastSpace + 1 : MAX_SPEECH_CHUNK_CHARS;
}

/**
 * Longitud del próximo fragmento hablable mientras el texto AÚN llega en
 * streaming: solo corta en límites COMPLETOS (oración/cláusula) para no leer
 * palabras a medio transmitir. Devuelve la longitud del fragmento, o `-1` si
 * conviene esperar más texto. Acotado siempre al tope duro.
 */
export function nextStreamingChunkLength(pending: string, isFirstChunk: boolean): number {
  const boundary = findFirstSpeakableBoundary(pending, streamBoundaryConfig(isFirstChunk));
  if (boundary <= 0) {
    // Sin límite natural todavía: solo forzamos un corte si el texto pendiente
    // ya rebasa el tope duro (evita acumular un fragmento ilimitado).
    return pending.length > MAX_SPEECH_CHUNK_CHARS
      ? clampToMaxChars(pending, pending.length)
      : -1;
  }
  return clampToMaxChars(pending, boundary);
}

/**
 * Longitud del próximo fragmento al FINALIZAR la respuesta: el texto ya está
 * completo, así que SIEMPRE consume (nunca espera). Prefiere un límite de
 * oración; si no lo hay, toma lo que reste, siempre acotado al tope duro. Se
 * llama en bucle para trocear TODO el remanente, sin tope de número de chunks.
 */
export function nextFinalChunkLength(pending: string, isFirstChunk: boolean): number {
  const boundary = findFirstSpeakableBoundary(pending, streamBoundaryConfig(isFirstChunk));
  const length = boundary > 0 ? boundary : pending.length;
  return clampToMaxChars(pending, length);
}
