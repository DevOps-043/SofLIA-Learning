import type { DetectionRule } from './prompt-injection-detector.types'

export const DETECTION_RULES: DetectionRule[] = [
  {
    category: 'system_override',
    weight: 30,
    reason: 'Attempt to override system or developer instructions.',
    patterns: [
      /\bignore\b.{0,40}\b(previous|prior|system|developer|all)\b.{0,40}\binstructions?\b/i,
      /\bforget\b.{0,40}\b(previous|prior|system|developer)\b/i,
      /\boverride\b.{0,40}\b(system|developer|safety|policy)\b/i,
      /\bnew system prompt\b/i,
      /\bignora\b.{0,40}\b(instrucciones?|restricciones?|reglas|sistema|previas)\b/i,
    ],
  },
  {
    category: 'prompt_leak',
    weight: 40,
    reason: 'Attempt to reveal hidden prompts or internal instructions.',
    patterns: [
      /\breveal\b.{0,40}\b(system prompt|hidden prompt|developer prompt|internal instructions?)\b/i,
      /\bshow\b.{0,40}\b(system prompt|developer message|hidden instructions?)\b/i,
      /\bdump\b.{0,40}\b(prompt|instructions?|policy)\b/i,
      /\bprint\b.{0,40}\b(system prompt|developer prompt)\b/i,
      /\bmuestrame\b.{0,40}\b(system prompt|hidden instructions|cookies|tokens|endpoints?)\b/i,
      /\bmuestra\b.{0,40}\b(system prompt|prompt|instrucciones?|cookies|tokens|endpoints?)\b/i,
      /\brevela\b.{0,40}\b(prompt|instrucciones?|cookies|tokens|endpoints?)\b/i,
    ],
  },
  {
    category: 'internal_systems',
    weight: 45,
    reason: 'Attempt to obtain internal system details such as models, endpoints, tables, schema, or user fields.',
    patterns: [
      /\b(describe|explica|detalla|lista|dame|muestrame|cuales son|cual es|que)\b.{0,40}\b(endpoints?|apis?|rutas internas?|base de datos|schema|esquema|entidad relacion|erd|tablas?|campos?|columnas?)\b/i,
      /\b(campos?|columnas?)\b.{0,40}\b(tabla|users|course_lessons|lesson_activities|material_lessons|lia_messages|lia_conversations|organization_users|user_course_enrollments)\b/i,
      /\b(tablas?|schema|esquema|entidad relacion|erd)\b.{0,40}\b(cursos|usuarios|base de datos|db|soflia)\b/i,
      /\b(que|cual|dime|dame|describe|explica)\b.{0,30}\b(modelo de ia|modelo usas|modelo utilizas|llm|proveedor de ia|proveedor externo|claude|gemini)\b/i,
      /\b(users|course_lessons|lesson_activities|material_lessons|lia_messages|lia_conversations|organization_users|user_course_enrollments)\b.{0,40}\b(campos?|columnas?|schema|esquema|endpoints?)\b/i,
    ],
  },
  {
    category: 'secret_access',
    weight: 45,
    reason: 'Attempt to access credentials, cookies, tokens, or private data.',
    patterns: [
      /\b(show|reveal|dump|extract|get|steal|read|access|obtain)\b.{0,25}\b(cookie|cookies|session token|access token|refresh token|jwt|api key|secret|credential)s?\b/i,
      /\b(muestra|revela|extrae|obten|lee|accede|roba)\b.{0,25}\b(cookie|token|credencial|secreto)s?\b/i,
      /\bexfiltrat(?:e|ion)\b/i,
      /\bsteal\b.{0,20}\b(cookie|token|credential|secret)\b/i,
      /\broba(?:r)?\b.{0,20}\b(cookie|token|credencial|secreto)\b/i,
    ],
  },
]
