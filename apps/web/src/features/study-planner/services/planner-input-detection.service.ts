import type { StudyApproach } from '../types/planner-ui.types';

const SHORT_APPROACH_TOKENS = ['corto', 'cortas', 'rapido', 'rapidos', 'rapida', 'rapidas'] as const;
const BALANCED_APPROACH_TOKENS = ['balance', 'equilibrado', 'equilibrada', 'normal', 'normales'] as const;
const LONG_APPROACH_TOKENS = ['largo', 'largas', 'extensas', 'profundizar', 'sin prisa'] as const;
const TARGET_DATE_HINTS = ['mes', 'semana', 'dia', 'dias'] as const;
const TARGET_DATE_PATTERN =
  /(\d{1,2})\/(\d{1,2})\/(\d{4})|(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})|(\w+)\s+(\d{1,2}),?\s+(\d{4})/i;

function normalizeStudyPlannerText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function includesAny(value: string, tokens: readonly string[]): boolean {
  return tokens.some((token) => value.includes(token));
}

export function detectStudyPlannerApproachFromMessage(message: string): StudyApproach | null {
  const normalizedMessage = normalizeStudyPlannerText(message);

  if (includesAny(normalizedMessage, SHORT_APPROACH_TOKENS)) {
    return 'corto';
  }

  if (includesAny(normalizedMessage, BALANCED_APPROACH_TOKENS)) {
    return 'balance';
  }

  if (includesAny(normalizedMessage, LONG_APPROACH_TOKENS)) {
    return 'largo';
  }

  return null;
}

export function looksLikeStudyPlannerTargetDateMessage(message: string): boolean {
  const normalizedMessage = normalizeStudyPlannerText(message);

  return TARGET_DATE_PATTERN.test(message) || includesAny(normalizedMessage, TARGET_DATE_HINTS);
}
