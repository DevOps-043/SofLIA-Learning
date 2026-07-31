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

const DIACRITIC_MARKS = /[̀-ͯ]/g;

export function hasActivityLearningContext(
  requestContext?: ChatRequest['context']
): boolean {
  return Boolean(
    requestContext?.currentActivityContext ||
      requestContext?.currentLessonContext?.activities?.currentActivityFocus
  );
}

/**
 * Los patrones de abajo están escritos sin tildes, pero los usuarios escriben
 * "lección", "página" o "botón". Sin esta normalización esas palabras nunca
 * coincidían y el contexto técnico de la página no se adjuntaba al prompt.
 */
function normalizeForMatching(message: string): string {
  return message
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITIC_MARKS, '');
}

/**
 * Heurística de intención usada SOLO para enriquecer el prompt (metadata técnica
 * de la página) y para decidir si el turno se sirve en modo buffered.
 *
 * No decide si un reporte se guarda: esa señal es el bloque oculto que emite el
 * modelo. Un falso negativo aquí degrada el contexto, nunca pierde un reporte.
 */
export function detectTechnicalBugReportIntent(
  input: BugReportIntentInput
): BugReportIntentResult {
  const normalizedMessage = normalizeForMatching(input.message);
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
    /\b(no funciona|no carga|no responde|no reproduce|no se escucha|no puedo escuchar|no me deja|se traba|se trabo|se congela|se colgo|pantalla en blanco|timeout|crash|broken|500|404)\b/i.test(
      normalizedMessage
    ) ||
    /\b(pagina|plataforma|sistema|soflia|lms|curso|leccion|actividad|boton|input|chat|login|audio|video|reading|lectura|guardar|enviar|abrir|cerrar)\b.{0,50}\b(error|falla|bug|no funciona|no carga|se traba|se trabo)\b/i.test(
      normalizedMessage
    ) ||
    /\b(problema|dificultad|inconveniente)\b.{0,60}\b(pagina|plataforma|sistema|soflia|lms|curso|leccion|actividad|boton|chat|login|audio|video|reading|lectura|certificado)\b/i.test(
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
