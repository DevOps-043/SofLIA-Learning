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

  it('strips stray/split markdown markers so TTS does not read them aloud', () => {
    // En streaming, un par **negrita** puede quedar partido entre fragmentos:
    // el limpiador por-fragmento no lo reconoce como par, así que antes la voz
    // leía los asteriscos sueltos. Ahora se eliminan los marcadores residuales.
    expect(cleanTextForLiaTTS('Hola **mun')).toBe('Hola mun');
    expect(cleanTextForLiaTTS('do** importante')).toBe('do importante');
    expect(cleanTextForLiaTTS('texto _enfati')).toBe('texto enfati');
    expect(cleanTextForLiaTTS('- primer punto')).toBe('primer punto');
  });

  it('maps supported languages and falls back to spanish', () => {
    expect(getLiaSpeechLanguage('en')).toBe('en-US');
    expect(getLiaSpeechLanguage('pt')).toBe('pt-BR');
    expect(getLiaSpeechLanguage('fr')).toBe('es-ES');
  });
});
