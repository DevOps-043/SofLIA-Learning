export const PROMPT_INJECTION_PATTERNS = [
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
] as const

export const LOOP_PATTERNS = [
  /confirmes?\s+los\s+dias/i,
  /te\s+refieres\s+a\s+todos\s+los/i,
  /que\s+dias.*prefieres/i,
  /que\s+horario.*funciona/i,
  /podrias?.*ampliar.*horarios/i,
  /necesito\s+que\s+me\s+confirmes/i,
] as const

export const PROMPT_LEAK_PREFIXES = [
  'prompt maestro',
  'identidad',
  'datos',
  'instruccion critica',
  'rol y personalidad',
  'reglas principales',
  'objetivo operativo',
] as const

export const FINAL_SUMMARY_RESPONSE_TOKENS = [
  'resumen',
  'distribucion',
  'sesiones programadas',
  'plan de estudios',
  'sesiones generadas',
] as const
