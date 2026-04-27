import type { StudyPlannerMessage } from '../types/planner-ui.types';

export const SIMPLE_AFFIRMATIONS = new Set([
  'si',
  'ok',
  'acepto',
  'dale',
  'va',
  'vale',
  'perfecto',
  'genial',
  'excelente',
]);

export const SCHEDULE_CONFIRMATION_PHRASES = [
  'me sirven',
  'confirmo',
  'esta bien',
  'de acuerdo',
  'adelante',
  'procede',
] as const;

export const FINAL_SUMMARY_PHRASES = [
  'me gusta',
  'esta bien',
  'confirmo',
  'me parece',
  'de acuerdo',
  'adelante',
  'procede',
  'guardar',
  'crear plan',
] as const;

export const ADD_SCHEDULE_PHRASES = [
  'anade',
  'agrega',
  'agregar',
  'anadir',
  'incluye',
  'incluir',
  'suma',
  'sumar',
  'continuar',
  'continuemos',
  'colocar',
  'poner',
  'extender',
  'mas lecciones',
  'mas tiempo',
] as const;

export const TARGET_DATE_ACTIONS = ['cambiar', 'cambia', 'extender', 'extiende', 'actualizar', 'actualiza'] as const;
export const TARGET_DATE_OBJECTS = ['fecha', 'limite'] as const;

export function normalizePlannerText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function includesAny(value: string, candidates: readonly string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function isSimpleAffirmation(value: string): boolean {
  return SIMPLE_AFFIRMATIONS.has(value) || includesAny(value, ['esta bien', 'de acuerdo', 'adelante', 'claro']);
}

function getLastAssistantMessage(conversationHistory: StudyPlannerMessage[]): StudyPlannerMessage | undefined {
  return [...conversationHistory].reverse().find((message) => message.role === 'assistant');
}

export function detectSelectedOptionNumber(normalizedMessage: string): number | null {
  const optionMatch = normalizedMessage.match(/opcion\s*(\d)|la\s+(\d)|(\d)\s*(opcion)?|primera|segunda|tercera|cuarta/i);

  if (!optionMatch) {
    return null;
  }

  if (optionMatch[1]) return Number.parseInt(optionMatch[1], 10);
  if (optionMatch[2]) return Number.parseInt(optionMatch[2], 10);
  if (optionMatch[3]) return Number.parseInt(optionMatch[3], 10);
  if (normalizedMessage.includes('primera')) return 1;
  if (normalizedMessage.includes('segunda')) return 2;
  if (normalizedMessage.includes('tercera')) return 3;
  if (normalizedMessage.includes('cuarta')) return 4;

  return null;
}

export function buildExpandedScheduleAcceptanceMessage(
  message: string,
  normalizedMessage: string,
  conversationHistory: StudyPlannerMessage[],
  hasSavedDistribution: boolean,
): string | null {
  if (hasSavedDistribution || !isSimpleAffirmation(normalizedMessage)) {
    return null;
  }

  const lastAssistantMessage = getLastAssistantMessage(conversationHistory);
  const normalizedAssistantMessage = normalizePlannerText(lastAssistantMessage?.content ?? '');
  const wasDeadlineWarning = includesAny(normalizedAssistantMessage, [
    'no seria posible completar',
    'extenderia hasta',
    'ampliar tus horarios',
    'fines de semana',
    'fecha limite',
  ]);

  if (!wasDeadlineWarning) {
    return null;
  }

  const previousUserMessages = conversationHistory.filter((entry) => entry.role === 'user');
  const detectedDays = new Set<string>();
  const detectedTimes = new Set<string>();

  previousUserMessages.forEach((entry) => {
    const content = normalizePlannerText(entry.content);

    if (content.includes('lunes')) detectedDays.add('lunes');
    if (content.includes('martes')) detectedDays.add('martes');
    if (content.includes('miercoles')) detectedDays.add('miercoles');
    if (content.includes('jueves')) detectedDays.add('jueves');
    if (content.includes('viernes')) detectedDays.add('viernes');
    if (content.includes('sabado')) detectedDays.add('sabado');
    if (content.includes('domingo')) detectedDays.add('domingo');

    if (content.includes('manana')) detectedTimes.add('manana');
    if (content.includes('tarde')) detectedTimes.add('tarde');
    if (content.includes('noche')) detectedTimes.add('noche');
  });

  const baseDays = Array.from(detectedDays);
  const allDays = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const suggestedDays: string[] = [];

  if (!detectedDays.has('sabado')) suggestedDays.push('sabado');

  if (suggestedDays.length < 2) {
    const missingWeekdays = allDays.filter(
      (day) => !detectedDays.has(day) && day !== 'sabado',
    );
    suggestedDays.push(...missingWeekdays.slice(0, 2 - suggestedDays.length));
  }

  const expandedDays = [...baseDays, ...suggestedDays.slice(0, 2)];
  const expandedTimes = Array.from(detectedTimes);

  if (expandedTimes.length === 0) {
    expandedTimes.push('noche');
  }

  let additionalTime = '';
  if (expandedTimes.length === 1) {
    const missingTimes = ['manana', 'tarde', 'noche'].filter((time) => !expandedTimes.includes(time));
    if (missingTimes[0]) {
      additionalTime = ` y ${missingTimes[0]}`;
    }
  }

  return (
    `${message}\n\n[SISTEMA: El usuario ACEPTO ampliar sus horarios. ` +
    `Sus dias originales eran: ${baseDays.join(', ') || 'no especificados'}. ` +
    `Sus horarios originales eran: ${expandedTimes.join(', ') || 'noche'}. ` +
    `PROPON INMEDIATAMENTE este plan expandido: "${expandedDays.join(', ')} por la ${expandedTimes.join(' y ')}${additionalTime}". ` +
    'NO vuelvas a preguntar si quiere ampliar; ya lo confirmo. ' +
    'Genera el plan con estos horarios expandidos AHORA.]'
  );
}

export function buildAlternativeSelectionMessage(
  message: string,
  selectedOptionNumber: number | null,
  conversationHistory: StudyPlannerMessage[],
  hasSavedDistribution: boolean,
): string | null {
  if (hasSavedDistribution || selectedOptionNumber === null) {
    return null;
  }

  const lastAssistantMessage = getLastAssistantMessage(conversationHistory);
  const normalizedAssistantMessage = normalizePlannerText(lastAssistantMessage?.content ?? '');
  const wasAlternativesMessage = includesAny(normalizedAssistantMessage, [
    'opcion',
    'alternativas',
    'fecha limite',
  ]);

  if (!wasAlternativesMessage) {
    return null;
  }

  return (
    `${message}\n\n[SISTEMA: El usuario eligio la OPCION ${selectedOptionNumber}. ` +
    'Busca en tu contexto los datos de esa alternativa (dias, horarios y duracion de sesion). ' +
    'GENERA EL PLAN INMEDIATAMENTE con esos parametros. ' +
    'La opcion ya fue validada y garantiza terminar antes del deadline. ' +
    'NO preguntes de nuevo; simplemente genera el plan con la opcion elegida.]'
  );
}
