import { describe, expect, it } from 'vitest';
import { cleanTextForLiaTTS, getLiaSpeechLanguage } from '../services/lia-side-panel-voice.service';

describe('lia-side-panel-voice.service', () => {
  it('normalizes markdown-heavy text before TTS playback', () => {
    const text = [
      '# Titulo',
      '',
      '**Texto** con [enlace](https://example.com) y `codigo`.',
      '',
      '```ts',
      'const hidden = true;',
      '```',
      '',
      '> cita',
    ].join('\n');

    expect(cleanTextForLiaTTS(text)).toBe('Titulo\n\nTexto con enlace y codigo.\n\ncita');
  });

  it('maps supported languages and falls back to spanish', () => {
    expect(getLiaSpeechLanguage('en')).toBe('en-US');
    expect(getLiaSpeechLanguage('pt')).toBe('pt-BR');
    expect(getLiaSpeechLanguage('fr')).toBe('es-ES');
  });
});
