import { describe, expect, it } from 'vitest';

import {
  MAX_SPEECH_CHUNK_CHARS,
  nextFinalChunkLength,
  nextStreamingChunkLength,
} from '../client/speech-chunker';

describe('nextStreamingChunkLength', () => {
  it('waits for a complete boundary before emitting the first chunk', () => {
    // Texto corto sin límite de oración/cláusula todavía → conviene esperar.
    expect(nextStreamingChunkLength('Hola', true)).toBe(-1);
  });

  it('cuts the first chunk on an early clause to start audio sooner', () => {
    const length = nextStreamingChunkLength('Claro que sí, ahora te explico el resto.', true);
    expect(length).toBeGreaterThan(0);
    expect(length).toBeLessThanOrEqual('Claro que sí, '.length);
  });

  it('never returns a chunk longer than the hard ceiling', () => {
    const noPunctuation = 'palabra '.repeat(200); // > MAX_SPEECH_CHUNK_CHARS, sin puntuación
    const length = nextStreamingChunkLength(noPunctuation, false);
    expect(length).toBeGreaterThan(0);
    expect(length).toBeLessThanOrEqual(MAX_SPEECH_CHUNK_CHARS);
  });
});

describe('nextFinalChunkLength', () => {
  it('always consumes remaining text (never returns -1)', () => {
    // Un fragmento final sin puntuación debe consumirse igualmente.
    expect(nextFinalChunkLength('coda sin punto', false)).toBe('coda sin punto'.length);
  });

  it('chunks an entire long answer without exceeding the ceiling per chunk', () => {
    const longAnswer = 'Esta es una oración de ejemplo. '.repeat(60); // ~1900 chars
    let consumed = 0;
    let chunks = 0;
    while (consumed < longAnswer.length) {
      const pending = longAnswer.slice(consumed);
      const length = nextFinalChunkLength(pending, consumed === 0);
      expect(length).toBeGreaterThan(0);
      expect(length).toBeLessThanOrEqual(MAX_SPEECH_CHUNK_CHARS);
      consumed += length;
      chunks += 1;
      expect(chunks).toBeLessThan(200); // guardia anti-bucle
    }
    // Toda la respuesta se consume (antes se cortaba al cuarto fragmento).
    expect(consumed).toBe(longAnswer.length);
    expect(chunks).toBeGreaterThan(4);
  });
});
