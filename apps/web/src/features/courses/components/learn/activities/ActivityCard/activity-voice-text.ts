import { normalizeContentForRenderer } from '@/lib/course-content';
import { MAX_TTS_TEXT_LENGTH } from '@/core/services/tts/shared';

// Troceo ADAPTATIVO: el primer chunk es pequeño (~200 chars) para que el primer
// audio llegue rápido; los siguientes son mayores (~450 chars) para reducir el
// número de cortes de entonación (cada chunk se sintetiza aislado y "reinicia"
// la prosodia) y la cantidad de peticiones.
export const FIRST_CHUNK_CHARS = 200;
export const REST_CHUNK_CHARS = 450;

/**
 * Convierte el contenido de una actividad (HTML/markdown/estructurado) en texto
 * plano apto para TTS y lo trunca en una frontera de oración si excede el límite.
 * Función pura: misma entrada → misma salida.
 */
export function extractPlainText(content: unknown): string {
  const raw = normalizeContentForRenderer(content);
  if (!raw.trim()) return '';

  const stripped = raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1')
    .replace(/([^*])\*([^*]+)\*([^*])/g, '$1$2$3')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (stripped.length <= MAX_TTS_TEXT_LENGTH) return stripped;
  const truncated = stripped.slice(0, MAX_TTS_TEXT_LENGTH);
  const lastStop = Math.max(
    truncated.lastIndexOf('. '), truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('! '), truncated.lastIndexOf('? '),
  );
  return lastStop > MAX_TTS_TEXT_LENGTH * 0.7 ? truncated.slice(0, lastStop + 1) : truncated.trimEnd();
}

/**
 * Divide el texto en chunks por oraciones, con tamaño adaptativo (primer chunk
 * pequeño para arranque rápido, resto mayores para prosodia más continua).
 */
export function splitIntoSentenceChunks(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';
  // El límite depende de si ya emitimos el primer chunk (arranque rápido) o no.
  const limitFor = () => (chunks.length === 0 ? FIRST_CHUNK_CHARS : REST_CHUNK_CHARS);

  for (const sentence of sentences) {
    const maxLen = limitFor();
    // Si una sola oración supera el límite, la partimos por comas.
    if (sentence.length > maxLen) {
      if (current) { chunks.push(current); current = ''; }
      const subChunks = hardSplitLongSentence(sentence, limitFor());
      chunks.push(...subChunks);
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

/** Parte una oración demasiado larga en sub-chunks por comas, sin superar `maxLen`. */
export function hardSplitLongSentence(sentence: string, maxLen: number): string[] {
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
