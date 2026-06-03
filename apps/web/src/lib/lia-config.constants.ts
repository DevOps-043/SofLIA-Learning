export const SOFLIA_ALLOWED_TOPICS = [
  'creaciÃ³n de prompts',
  'estructura de prompts',
  'optimizaciÃ³n de prompts',
  'categorÃ­as de prompts',
  'mejores prÃ¡cticas de prompts',
] as const

export const SOFLIA_FORBIDDEN_TOPICS = [
  'consultorÃ­a general de IA',
  'chistes o conversaciÃ³n casual',
  'preguntas personales',
  'temas no relacionados con prompts',
  'explicaciones generales de IA',
] as const

export const SOFLIA_PROMPT_INJECTION_PATTERNS = [
  'ignore previous instructions',
  'disregard all prior commands',
  'act as a',
  'jailbreak',
  'forget everything',
  'new instructions',
  'override',
  'system prompt',
  'you are now',
  'pretend to be',
  'roleplay as',
  'dan mode',
  'developer mode',
] as const

export const SOFLIA_OFF_TOPIC_PATTERNS = [
  'quÃ© es la inteligencia artificial',
  'cÃ³mo funciona la ia',
  'quÃ© es chatgpt',
  'cuÃ©ntame un chiste',
  'cÃ³mo estÃ¡s',
  'quÃ© hora es',
  'quÃ© dÃ­a es hoy',
  'cuÃ¡l es tu nombre',
  'de dÃ³nde eres',
  'quÃ© opinas de',
  'ayÃºdame con mi tarea',
  'resuelve este problema',
  'explica este concepto',
] as const

export const SOFLIA_RESPONSES = {
  offTopic: 'Mi especialidad es la creaciÃ³n de prompts de IA. Â¿En quÃ© tipo de prompt te gustarÃ­a trabajar hoy?',
  greeting: 'Hola, soy SofLIA, tu especialista en creaciÃ³n de prompts de IA. Â¿QuÃ© tipo de prompt necesitas crear?',
  clarification: 'Para crear el mejor prompt para ti, necesito mÃ¡s detalles especÃ­ficos sobre: [Ã¡rea especÃ­fica]',
  redirect: 'Me enfoco exclusivamente en la creaciÃ³n de prompts. Â¿PodrÃ­as contarme quÃ© tipo de prompt necesitas?',
  professionalClose: 'Â¿Hay algo mÃ¡s especÃ­fico sobre tu prompt que te gustarÃ­a ajustar?',
  injectionDetected: 'DetectÃ© un patrÃ³n que podrÃ­a intentar manipular mis instrucciones. Mi propÃ³sito es ayudarte a crear prompts profesionales y seguros. Por favor, reformula tu solicitud para que sea constructiva y Ã©tica.',
} as const

export const SOFLIA_PROMPT_CATEGORIES = [
  'Marketing y Ventas',
  'Contenido Creativo',
  'ProgramaciÃ³n y Desarrollo',
  'AnÃ¡lisis de Datos',
  'EducaciÃ³n y CapacitaciÃ³n',
  'RedacciÃ³n y ComunicaciÃ³n',
  'InvestigaciÃ³n y AnÃ¡lisis',
  'AutomatizaciÃ³n de Procesos',
  'Arte y DiseÃ±o',
  'Negocios y Estrategia',
] as const

export const SOFLIA_PROMPT_STRUCTURE = {
  required: ['title', 'description', 'content', 'tags', 'difficulty_level', 'use_cases', 'tips'],
  optional: ['category', 'estimated_time', 'prerequisites'],
} as const

export const SOFLIA_DIFFICULTY_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
] as const

export const SOFLIA_GEMINI_CONFIG = {
  model: 'gemini-3.5-flash',
  temperature: 0.7,
  maxTokens: 1000,
} as const
