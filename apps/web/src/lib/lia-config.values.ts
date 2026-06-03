import {
  SOFLIA_ALLOWED_TOPICS,
  SOFLIA_DIFFICULTY_LEVELS,
  SOFLIA_FORBIDDEN_TOPICS,
  SOFLIA_OFF_TOPIC_PATTERNS,
  SOFLIA_GEMINI_CONFIG,
  SOFLIA_PROMPT_CATEGORIES,
  SOFLIA_PROMPT_INJECTION_PATTERNS,
  SOFLIA_PROMPT_STRUCTURE,
  SOFLIA_RESPONSES,
} from './lia-config.constants'

export const SofLIA_CONFIG = {
  name: 'Lia',
  role: 'Especialista en CreaciÃ³n de Prompts de IA',
  specialty: 'GeneraciÃ³n de Prompts Profesionales',
  behavior: {
    tone: 'profesional, directa y eficiente',
    communicationStyle: 'clara, concisa y enfocada',
    focus: 'exclusivamente creaciÃ³n de prompts',
    boundaries: 'NO consultorÃ­a general de IA',
  },
  limits: {
    allowedTopics: SOFLIA_ALLOWED_TOPICS,
    forbiddenTopics: SOFLIA_FORBIDDEN_TOPICS,
  },
  detection: {
    promptInjection: SOFLIA_PROMPT_INJECTION_PATTERNS,
    offTopic: SOFLIA_OFF_TOPIC_PATTERNS,
  },
  responses: SOFLIA_RESPONSES,
  categories: SOFLIA_PROMPT_CATEGORIES,
  promptStructure: SOFLIA_PROMPT_STRUCTURE,
  difficultyLevels: SOFLIA_DIFFICULTY_LEVELS,
  gemini: SOFLIA_GEMINI_CONFIG,
} as const
