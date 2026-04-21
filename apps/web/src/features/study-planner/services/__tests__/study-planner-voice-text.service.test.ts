import { describe, expect, it } from 'vitest';
import {
  formatTextForTTS,
  resolveSpeechQueue,
  stripMarkdownForSpeech,
} from '../study-planner-voice-text.service';

describe('study-planner-voice-text.service', () => {
  it('removes markdown, links, bullets and action tags before speaking', () => {
    const result = stripMarkdownForSpeech(`
## Resumen
- **Sesion** reprogramada
- Revisa [tu calendario](https://example.com)
<action>{"type":"move_session"}</action>
\`\`\`json
{"debug":true}
\`\`\`
`);

    expect(result).toContain('Resumen');
    expect(result).toContain('Sesion reprogramada');
    expect(result).toContain('Revisa tu calendario');
    expect(result).not.toContain('<action>');
    expect(result).not.toContain('```');
    expect(result).not.toContain('https://example.com');
  });

  it('replaces long responses with a short spoken summary', () => {
    const result = formatTextForTTS(
      'Primero revisa tus sesiones. Luego valida el calendario. Despues confirma el ajuste. Finalmente revisa el panel y el detalle adicional que dejare en pantalla para que no se corte la lectura completa.',
    );

    expect(result).toBe('Tengo el detalle listo en pantalla.');
  });

  it('keeps queued items unless the user interrupts or replaces playback', () => {
    expect(resolveSpeechQueue(['uno'], 'dos', 'enqueue')).toEqual(['uno', 'dos']);
    expect(resolveSpeechQueue(['uno'], 'dos', 'replace')).toEqual(['dos']);
    expect(resolveSpeechQueue(['uno'], 'dos', 'interruptByUser')).toEqual(['dos']);
  });
});
