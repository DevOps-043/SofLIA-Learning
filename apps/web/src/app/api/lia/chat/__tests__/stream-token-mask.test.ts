import { describe, expect, it } from 'vitest';
import { createBugReportTokenStreamMask } from '../lia-report-workflow/stream-token-mask';

function streamThrough(chunks: string[]): string {
  const mask = createBugReportTokenStreamMask();
  return chunks.map(chunk => mask.push(chunk)).join('') + mask.flush();
}

describe('createBugReportTokenStreamMask', () => {
  it('hides a complete draft token from the streamed text', () => {
    const visible = streamThrough([
      'Preparé el borrador técnico. ¿Confirmas?',
      '\n\n[[BUG_REPORT_DRAFT:{"title":"Audio no reproduce","description":"El reading de la leccion 3 no suena","category":"bug","priority":"media"}]]',
    ]);

    expect(visible).toBe('Preparé el borrador técnico. ¿Confirmas?\n\n');
  });

  it('hides a token split across arbitrary chunk boundaries', () => {
    const visible = streamThrough([
      'Listo el borrador.\n\n[[BUG_RE',
      'PORT_DRAFT:{"title":"Audio',
      ' no reproduce","description":"Falla el reading","category":"bug","priority":"media"',
      '}]]',
    ]);

    expect(visible).toBe('Listo el borrador.\n\n');
  });

  it('never leaks a partial marker while it is still arriving', () => {
    const mask = createBugReportTokenStreamMask();

    expect(mask.push('Texto visible [[BUG_REPORT_DRAFT:{"title":"a"')).toBe(
      'Texto visible ',
    );
    expect(mask.push(',"description":"b","category":"bug","priority":"media"}]]')).toBe('');
  });

  it('discards a truncated marker when the stream ends mid-token', () => {
    const visible = streamThrough(['Borrador listo.\n\n[[BUG_REPORT_DRAFT:{"title":"inc']);

    expect(visible).toBe('Borrador listo.\n\n');
  });

  it('keeps ordinary brackets such as markdown links intact', () => {
    const visible = streamThrough([
      'Revisa tu [Perfil](/profile) y el [Dashboard]',
      '(/dashboard) para continuar.',
    ]);

    expect(visible).toBe(
      'Revisa tu [Perfil](/profile) y el [Dashboard](/dashboard) para continuar.',
    );
  });

  it('keeps text written after the hidden token', () => {
    const visible = streamThrough([
      'Borrador listo. [[BUG_REPORT:{"title":"x","description":"y","category":"bug","priority":"baja"}]] Dime si lo ajusto.',
    ]);

    expect(visible).toBe('Borrador listo.  Dime si lo ajusto.');
  });

  it('emits plain text unchanged when there is no marker at all', () => {
    const visible = streamThrough(['Hola, ', 'esto es una respuesta normal.']);

    expect(visible).toBe('Hola, esto es una respuesta normal.');
  });
});
