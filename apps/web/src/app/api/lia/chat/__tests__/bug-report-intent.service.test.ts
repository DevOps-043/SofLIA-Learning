import { describe, expect, it } from 'vitest';
import { detectTechnicalBugReportIntent } from '../bug-report-intent.service';

const activityContext = {
  currentActivityContext: {
    title: 'Actividad de comunicacion',
    type: 'ai_chat',
    description: 'Describe una situacion complicada de comunicacion.',
  },
};

describe('detectTechnicalBugReportIntent', () => {
  it('does not treat learning evidence in an activity as a bug report', () => {
    const result = detectTechnicalBugReportIntent({
      message:
        'Tuve un problema de comunicacion con mi equipo porque no explique bien el contexto.',
      requestContext: activityContext,
    });

    expect(result.isBugReport).toBe(false);
    expect(result.hasActivityLearningContext).toBe(true);
  });

  it('detects explicit platform report intent inside an activity', () => {
    const result = detectTechnicalBugReportIntent({
      message:
        'Quiero reportar que la pagina de la actividad se trabo y no me deja enviar.',
      requestContext: activityContext,
    });

    expect(result.isBugReport).toBe(true);
  });

  it('does not trigger on generic business or customer problems', () => {
    const result = detectTechnicalBugReportIntent({
      message:
        'El problema con el cliente fue que no entendia el impacto de su decision.',
    });

    expect(result.isBugReport).toBe(false);
  });

  it('honors the explicit bug report flag', () => {
    const result = detectTechnicalBugReportIntent({
      message: 'Necesito ayuda con esto.',
      isBugReportFlag: true,
      requestContext: activityContext,
    });

    expect(result.isBugReport).toBe(true);
  });
});
