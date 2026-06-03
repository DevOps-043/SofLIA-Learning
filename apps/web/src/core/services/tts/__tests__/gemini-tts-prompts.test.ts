import { describe, expect, it } from 'vitest';

import {
  buildReadingSpeechPrompt,
  inferReadingExpressionTags,
} from '../gemini-tts-prompts';

describe('gemini tts prompt decoration', () => {
  it('adds conservative expression tags based on punctuation and context', () => {
    expect(inferReadingExpressionTags('Que pasaria si automatizamos esto?', 'reading'))
      .toContain('curious');
    expect(inferReadingExpressionTags('Excelente avance!', 'reading'))
      .toContain('amazed');
    expect(inferReadingExpressionTags('Importante: riesgo critico para el equipo.'))
      .toContain('serious');
  });

  it('embeds tags and content in reading prompts', () => {
    const prompt = buildReadingSpeechPrompt('Que impacto tendra este cambio?');

    expect(prompt).toContain('[curious]');
    expect(prompt).toContain('Que impacto tendra este cambio?');
  });
});
