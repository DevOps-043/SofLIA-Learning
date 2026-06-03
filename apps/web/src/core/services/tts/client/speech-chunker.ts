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
