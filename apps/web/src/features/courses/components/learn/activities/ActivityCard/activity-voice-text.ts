import {
  READABLE_AUDIO_FIRST_SEGMENT_CHARS,
  READABLE_AUDIO_SEGMENT_CHARS,
  normalizeReadableText,
  splitReadableText,
} from '@/core/services/tts/readable-audio';

export const FIRST_CHUNK_CHARS = READABLE_AUDIO_FIRST_SEGMENT_CHARS;
export const REST_CHUNK_CHARS = READABLE_AUDIO_SEGMENT_CHARS;

export function extractPlainText(content: unknown): string {
  return normalizeReadableText(content);
}

export function splitIntoSentenceChunks(text: string): string[] {
  return splitReadableText(text);
}

export function hardSplitLongSentence(sentence: string, maxLen: number): string[] {
  const parts = sentence.split(/(?<=,)\s+/u);
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
