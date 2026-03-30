import type { StudyPlannerMessage } from '../types/planner-ui.types';

const PROMPT_INJECTION_PATTERNS = [
  /ignora\s+(?:todas?\s+)?las?\s+instrucciones/i,
  /olvida\s+(?:que\s+)?eres/i,
  /ahora\s+eres/i,
  /actua\s+como/i,
  /se\s+que\s+eres\s+un\s+asistente/i,
  /muestrame\s+el\s+prompt/i,
  /revela\s+las?\s+instrucciones/i,
  /dime\s+tu\s+configuracion/i,
  /ejecuta\s+(?:codigo|comando|script)/i,
  /system\s*:\s*ignore/i,
  /\[system\]/i,
  /<\|system\|>/i,
] as const;

const LOOP_PATTERNS = [
  /confirmes?\s+los\s+dias/i,
  /te\s+refieres\s+a\s+todos\s+los/i,
  /que\s+dias.*prefieres/i,
  /que\s+horario.*funciona/i,
  /podrias?.*ampliar.*horarios/i,
  /necesito\s+que\s+me\s+confirmes/i,
] as const;

const PROMPT_LEAK_PREFIXES = [
  'prompt maestro',
  'identidad',
  'datos',
  'instruccion critica',
  'rol y personalidad',
  'reglas principales',
  'objetivo operativo',
] as const;

const FINAL_SUMMARY_RESPONSE_TOKENS = [
  'resumen',
  'distribucion',
  'sesiones programadas',
  'plan de estudios',
  'sesiones generadas',
] as const;

export interface PlannerPreSendGuardrailResult {
  blocked: boolean;
  enrichedMessage: string;
  assistantMessage?: string;
}

export interface PlannerFinalSaveGuardrailParams {
  userMessage: string;
  liaResponse: string;
  savedLessonDistributionCount: number;
}

interface ApplyPlannerPreSendGuardrailsParams {
  message: string;
  enrichedMessage: string;
  conversationHistory: StudyPlannerMessage[];
}

function normalizePlannerText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(normalizedValue: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => normalizedValue.includes(token));
}

function sanitizeHolidayMentions(value: string): string {
  let next = value;

  next = next.replace(/^\*?\s*jueves\s+1\s*:?.*$/gim, '');
  next = next.replace(/\*\s*08:00.*jueves\s+1.*\n?/gi, '');
  next = next.replace(/fechas:\s*1\s+de\s+enero/gi, 'Fechas: 2 de enero');
  next = next.replace(/1\s+de\s+enero\s*[-–]\s*(\d+\s+de\s+enero)/gi, '2 de enero - $1');
  next = next.replace(/\n{3,}/g, '\n\n');

  return next.trim();
}

function buildLoopEscapeInstruction(message: string): string {
  return `${message}\n\n[SISTEMA: Se detecto un posible bucle en la conversacion. ` +
    'En lugar de volver a preguntar lo mismo, propone opciones concretas y validadas para destrabar el plan. ' +
    'No vuelvas a pedir que el usuario confirme los mismos dias u horarios.]';
}

export function applyPlannerPreSendGuardrails(
  params: ApplyPlannerPreSendGuardrailsParams,
): PlannerPreSendGuardrailResult {
  const normalizedMessage = normalizePlannerText(params.message);
  const normalizedEnrichedMessage = normalizePlannerText(params.enrichedMessage);

  const hasInjectionAttempt = PROMPT_INJECTION_PATTERNS.some((pattern) =>
    pattern.test(normalizedMessage) || pattern.test(normalizedEnrichedMessage),
  );

  if (hasInjectionAttempt) {
    return {
      blocked: true,
      enrichedMessage: params.enrichedMessage,
      assistantMessage:
        'Entiendo que quieres probar diferentes cosas, pero estoy aqui especificamente para ayudarte con tu plan de estudios. ¿En que puedo asistirte con la planificacion de tus cursos?',
    };
  }

  const lastAssistantMessages = params.conversationHistory
    .filter((entry) => entry.role === 'assistant')
    .slice(-5);

  const loopCount = lastAssistantMessages.filter((entry) => {
    const normalizedContent = normalizePlannerText(entry.content);
    return LOOP_PATTERNS.some((pattern) => pattern.test(normalizedContent));
  }).length;

  if (loopCount >= 2) {
    return {
      blocked: false,
      enrichedMessage: buildLoopEscapeInstruction(params.message),
    };
  }

  return {
    blocked: false,
    enrichedMessage: params.enrichedMessage,
  };
}

export function sanitizePlannerAssistantResponse(value: string): string {
  const normalizedValue = normalizePlannerText(value);

  if (PROMPT_LEAK_PREFIXES.some((prefix) => normalizedValue.startsWith(prefix))) {
    return 'Perfecto. Vamos a continuar. ¿Que mas necesitas para tu plan de estudios?';
  }

  return sanitizeHolidayMentions(value);
}

export function shouldMarkFinalSummaryFromResponse(value: string): boolean {
  return includesAny(normalizePlannerText(value), FINAL_SUMMARY_RESPONSE_TOKENS);
}

export function shouldOpenCourseSelectorFromResponse(value: string): boolean {
  const normalizedValue = normalizePlannerText(value);

  return normalizedValue.includes('seleccionar cursos')
    || normalizedValue.includes('que cursos')
    || normalizedValue.includes('cursos te gustaria incluir');
}

export function shouldTriggerPlannerFinalSave(
  params: PlannerFinalSaveGuardrailParams,
): boolean {
  if (params.savedLessonDistributionCount === 0) {
    return false;
  }

  const normalizedMessage = normalizePlannerText(params.userMessage);
  const normalizedResponse = normalizePlannerText(params.liaResponse);

  const userConfirmed = /^(si|ok|claro|perfecto|me parece|esta bien|adelante|dale|va|seguro|gracias|genial)/i
    .test(normalizedMessage);

  const liaConfirmedSaving = /(guardad|guardar|exito|comenzar|dashboard|redireccion|creado|alegra|disfrut)/i
    .test(normalizedResponse);

  return userConfirmed && liaConfirmedSaving;
}
