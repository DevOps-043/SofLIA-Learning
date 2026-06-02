import { normalizeContentForRenderer } from '@/lib/course-content';
import { MAX_TTS_TEXT_LENGTH } from './shared';

export const READABLE_AUDIO_SOURCE_KINDS = [
  'lesson_description',
  'lesson_summary',
  'lesson_transcript',
  'activity_reading',
  'activity_reflection',
  'material_reading',
] as const;

export type ReadableAudioSourceKind = (typeof READABLE_AUDIO_SOURCE_KINDS)[number];
export type ReadableAudioLanguage = 'es' | 'en' | 'pt';

export const READABLE_AUDIO_FIRST_SEGMENT_CHARS = 700;
export const READABLE_AUDIO_SEGMENT_CHARS = Math.min(1_600, MAX_TTS_TEXT_LENGTH);

const HTML_ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
};

export function isReadableAudioSourceKind(value: string): value is ReadableAudioSourceKind {
  return READABLE_AUDIO_SOURCE_KINDS.includes(value as ReadableAudioSourceKind);
}

export function normalizeReadableAudioLanguage(value?: string | null): ReadableAudioLanguage {
  if (value === 'en' || value === 'pt') {
    return value;
  }

  return 'es';
}

export function normalizeReadableText(content: unknown): string {
  const raw = normalizeContentForRenderer(content);

  if (!raw.trim()) {
    return '';
  }

  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:amp|lt|gt|nbsp|quot|#39|apos);/g, (entity) => HTML_ENTITY_MAP[entity] || ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/([^*])\*([^*]+)\*([^*])/g, '$1$2$3')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function splitReadableText(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return [];
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const units = sentences.length > 0 ? sentences : [normalized];
  const chunks: string[] = [];
  let current = '';

  const limitForCurrentChunk = () =>
    chunks.length === 0 ? READABLE_AUDIO_FIRST_SEGMENT_CHARS : READABLE_AUDIO_SEGMENT_CHARS;

  for (const unit of units) {
    const maxLen = limitForCurrentChunk();

    if (unit.length > maxLen) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      chunks.push(...hardSplitReadableText(unit, maxLen));
      continue;
    }

    const candidate = current ? `${current} ${unit}` : unit;
    if (current && candidate.length > maxLen) {
      chunks.push(current);
      current = unit;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.filter((chunk) => chunk.length <= MAX_TTS_TEXT_LENGTH);
}

function hardSplitReadableText(text: string, maxLen: number): string[] {
  const parts = text.split(/(?<=,)\s+/u);
  const chunks: string[] = [];
  let current = '';

  for (const part of parts) {
    if (part.length > maxLen) {
      if (current) {
        chunks.push(current);
        current = '';
      }
      chunks.push(...splitByWords(part, maxLen));
      continue;
    }

    const candidate = current ? `${current} ${part}` : part;
    if (current && candidate.length > maxLen) {
      chunks.push(current);
      current = part;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function splitByWords(text: string, maxLen: number): string[] {
  const words = text.split(/\s+/u).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxLen) {
      chunks.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}
