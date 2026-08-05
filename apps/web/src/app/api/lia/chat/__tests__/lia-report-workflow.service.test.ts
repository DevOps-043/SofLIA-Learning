import { describe, expect, it } from 'vitest';
import {
  awaitsBugReportDetails,
  buildPendingBugReportPromptSection,
  detectBugReportConfirmationIntent,
  extractBugReportDraftToken,
  markPendingBugReportDetails,
  stripBugReportTokens,
} from '../lia-report-workflow.service';

describe('lia-report-workflow.service', () => {
  it('detects an explicit confirmation from the user', () => {
    expect(detectBugReportConfirmationIntent('Si, envialo')).toBe('confirm');
    expect(detectBugReportConfirmationIntent('Correcto, procede')).toBe(
      'confirm'
    );
  });

  it('detects when the user wants to adjust the draft', () => {
    expect(
      detectBugReportConfirmationIntent(
        'No, corrige la prioridad y agrega que fallo al guardar'
      )
    ).toBe('revise');
  });

  it('keeps unclear answers as neutral', () => {
    expect(
      detectBugReportConfirmationIntent('Tambien paso cuando cambie de pestana')
    ).toBe('unclear');
  });

  it('extracts and strips the hidden draft token', () => {
    const assistantMessage =
      'Te comparto el borrador tecnico.\n\n[[BUG_REPORT_DRAFT:{"title":"Error al cargar","description":"La leccion queda en blanco","category":"bug","priority":"alta"}]]';

    expect(extractBugReportDraftToken(assistantMessage)).toMatchObject({
      title: 'Error al cargar',
      description: 'La leccion queda en blanco',
      category: 'bug',
      priority: 'alta',
    });
    expect(stripBugReportTokens(assistantMessage)).toBe(
      'Te comparto el borrador tecnico.'
    );
  });

  it('builds a revision prompt that preserves the draft workflow', () => {
    const section = buildPendingBugReportPromptSection({
      title: 'Error al enviar quiz',
      description: 'El envio devuelve 500 despues de contestar.',
      category: 'bug',
      priority: 'alta',
    });

    expect(section).toContain('borrador de reporte pendiente');
    expect(section).toContain('BUG_REPORT_DRAFT');
    expect(section).toContain('NO uses [[BUG_REPORT:{...}]]');
  });

  /**
   * La marca de flujo abierto es la memoria del reporte entre turnos. Debe
   * detectarse en el historial y desaparecer del texto que ve el usuario.
   */
  it('remembers an open report flow without leaking the marker', () => {
    const persisted = markPendingBugReportDetails(
      'Describe que ocurrio y en que seccion paso.'
    );

    expect(awaitsBugReportDetails(persisted)).toBe(true);
    expect(stripBugReportTokens(persisted)).toBe(
      'Describe que ocurrio y en que seccion paso.'
    );
  });

  it('does not mistake an ordinary answer for an open report flow', () => {
    expect(awaitsBugReportDetails('Te faltan dos lecciones del modulo 3.')).toBe(
      false
    );
  });

  it('never duplicates the marker on repeated turns', () => {
    const once = markPendingBugReportDetails('Cuentame que ocurrio.');

    expect(markPendingBugReportDetails(once)).toBe(once);
  });
});
