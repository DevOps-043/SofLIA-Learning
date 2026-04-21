import type { StudyPlannerMessage } from '../types/planner-ui.types';
import {
  ADD_SCHEDULE_PHRASES,
  FINAL_SUMMARY_PHRASES,
  SCHEDULE_CONFIRMATION_PHRASES,
  SIMPLE_AFFIRMATIONS,
  TARGET_DATE_ACTIONS,
  TARGET_DATE_OBJECTS,
  buildAlternativeSelectionMessage,
  buildExpandedScheduleAcceptanceMessage,
  detectSelectedOptionNumber,
  includesAny,
  normalizePlannerText,
} from './planner-message-intent.helpers';

export interface PlannerMessageIntentResolution {
  resolvedMessage: string;
  selectedOptionNumber: number | null;
  isAddingSchedules: boolean;
  isChangingTargetDate: boolean;
  isConfirmingSchedules: boolean;
  isConfirmingFinalSummary: boolean;
}

interface ResolvePlannerMessageIntentParams {
  message: string;
  lowerMessage: string;
  conversationHistory: StudyPlannerMessage[];
  hasSavedDistribution: boolean;
}

/**
 * Analiza el mensaje del usuario en el contexto del planificador y resuelve su intención.
 *
 * Detecta si el usuario está:
 * - Seleccionando una opción de alternativas de fecha ("quiero la opción 2")
 * - Confirmando horarios propuestos ("sí", "confirmo")
 * - Confirmando el resumen final ("guardar", "crear plan")
 * - Añadiendo nuevos bloques de horario ("agrega jueves")
 * - Cambiando la fecha límite ("cambiar la fecha límite")
 *
 * También enriquece el mensaje con contexto de sistema cuando el asistente
 * estaba esperando una confirmación o selección específica.
 *
 * @param params.message - Mensaje original del usuario (con acentos)
 * @param params.lowerMessage - Mensaje en minúsculas para comparación rápida
 * @param params.conversationHistory - Historial de mensajes del chat
 * @param params.hasSavedDistribution - Si ya existe un plan de distribución guardado
 * @returns Resolución de intención con mensaje (posiblemente enriquecido) y flags booleanos
 */
export function resolvePlannerMessageIntent(
  params: ResolvePlannerMessageIntentParams,
): PlannerMessageIntentResolution {
  const normalizedMessage = normalizePlannerText(params.lowerMessage);
  const selectedOptionNumber = detectSelectedOptionNumber(normalizedMessage);

  let resolvedMessage = params.message;

  const expandedScheduleMessage = buildExpandedScheduleAcceptanceMessage(
    resolvedMessage,
    normalizedMessage,
    params.conversationHistory,
    params.hasSavedDistribution,
  );
  if (expandedScheduleMessage) {
    resolvedMessage = expandedScheduleMessage;
  }

  const alternativeSelectionMessage = buildAlternativeSelectionMessage(
    resolvedMessage,
    selectedOptionNumber,
    params.conversationHistory,
    params.hasSavedDistribution,
  );
  if (alternativeSelectionMessage) {
    resolvedMessage = alternativeSelectionMessage;
  }

  const isConfirmingSchedules =
    params.hasSavedDistribution &&
    (normalizedMessage.includes('si') ||
      includesAny(normalizedMessage, SCHEDULE_CONFIRMATION_PHRASES) ||
      normalizedMessage.includes('perfecto'));

  const isConfirmingFinalSummary =
    params.hasSavedDistribution &&
    (SIMPLE_AFFIRMATIONS.has(normalizedMessage) || includesAny(normalizedMessage, FINAL_SUMMARY_PHRASES));

  const isAddingSchedules =
    params.hasSavedDistribution &&
    ADD_SCHEDULE_PHRASES.some((phrase) => normalizedMessage.includes(phrase));

  const isChangingTargetDate =
    params.hasSavedDistribution &&
    TARGET_DATE_ACTIONS.some(
      (action) => normalizedMessage.includes(action) && TARGET_DATE_OBJECTS.some((token) => normalizedMessage.includes(token)),
    );

  return {
    resolvedMessage,
    selectedOptionNumber,
    isAddingSchedules,
    isChangingTargetDate,
    isConfirmingSchedules,
    isConfirmingFinalSummary,
  };
}
