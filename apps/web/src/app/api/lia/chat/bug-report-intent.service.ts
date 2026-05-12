import type { ChatRequest } from './platform-context.service';

export interface BugReportIntentInput {
  message: string;
  isBugReportFlag?: boolean;
  requestContext?: ChatRequest['context'];
  hasPendingDraft?: boolean;
}

export interface BugReportIntentResult {
  isBugReport: boolean;
  hasActivityLearningContext: boolean;
}

export function hasActivityLearningContext(
  requestContext?: ChatRequest['context']
): boolean {
  return Boolean(
    requestContext?.currentActivityContext ||
      requestContext?.currentLessonContext?.activities?.currentActivityFocus
  );
}

export function detectTechnicalBugReportIntent(
  input: BugReportIntentInput
): BugReportIntentResult {
  const normalizedMessage = input.message.trim().toLowerCase();
  const activityContext = hasActivityLearningContext(input.requestContext);

  if (input.isBugReportFlag || input.hasPendingDraft) {
    return {
      isBugReport: true,
      hasActivityLearningContext: activityContext,
    };
  }

  if (!normalizedMessage) {
    return {
      isBugReport: false,
      hasActivityLearningContext: activityContext,
    };
  }

  const explicitReportIntent =
    /\b(reportar|reporto|reporte|levantar|enviar|mandar|generar)\b.{0,50}\b(error|bug|falla|problema|incidencia|reporte tecnico|soporte|equipo tecnico)\b/i.test(
      normalizedMessage
    ) ||
    /\b(bug|error tecnico|falla tecnica|problema tecnico|incidencia tecnica|reporte tecnico)\b/i.test(
      normalizedMessage
    );

  const platformSymptom =
    /\b(no funciona|no carga|no responde|se traba|se trabo|se trab[oó]|se congela|se colgo|se colg[oó]|pantalla en blanco|timeout|crash|broken|500|404)\b/i.test(
      normalizedMessage
    ) ||
    /\b(pagina|plataforma|sistema|sofLIA|lms|curso|leccion|actividad|boton|input|chat|login|guardar|enviar|abrir|cerrar)\b.{0,50}\b(error|falla|bug|no funciona|no carga|se traba|se trabo|se trab[oó])\b/i.test(
      normalizedMessage
    );

  const isBugReport = activityContext
    ? explicitReportIntent || (/\b(reportar|reporte|soporte|equipo tecnico)\b/i.test(normalizedMessage) && platformSymptom)
    : explicitReportIntent || platformSymptom;

  return {
    isBugReport,
    hasActivityLearningContext: activityContext,
  };
}
