import type { PromptModelProfile } from '@/lib/ai/prompts'

import type { BusinessUserAnalyticsLocale } from '../../../types/business-user-analytics.types'

/**
 * VARIANTE OPENAI del prompt del coach personal de aprendizaje.
 *
 * Copia adaptada del prompt de Gemini (`prompt.google.ts`). Diferencias:
 *
 * 1. SIN EL CATÁLOGO DEL PAYLOAD. El original dedica ~15 líneas a describir campo
 *    por campo los datos que el modelo va a recibir de todos modos. En Gemini eso
 *    ayuda a que no ignore secciones del payload; los modelos de OpenAI leen el
 *    JSON entero sin ese índice previo, así que se elimina y el prompt baja de
 *    ~1.100 a ~500 tokens sin perder ninguna instrucción.
 *
 * 2. LOS EJEMPLOS SE MANTIENEN, PERO COMO EJEMPLOS. El original los mete dentro
 *    del JSON de salida serializado, lo que mezcla "forma esperada" con "cómo
 *    escribir". Aquí el esquema es esquema y los ejemplos van aparte.
 *
 * 3. LA REGLA ANTI-GENÉRICOS ES UNA PROHIBICIÓN EXPLÍCITA, no una nota al pie:
 *    es el fallo más frecuente de este informe.
 */

const OUTPUT_SCHEMA = `## Formato de salida

{
  "summary": "string",
  "metrics": [{ "label": "string", "value": "string", "detail": "string" }],
  "strengths": ["string"],
  "opportunities": ["string"],
  "recommendations": ["string"],
  "nextSteps": [{ "title": "string", "points": ["string"] }]
}`

const CONTENT_RULES = `## Que va en cada campo

- summary: 3-5 frases con la valoracion general, anclada en los 3 datos mas significativos y citando cifras reales. Empieza por lo que mas destaca.
- metrics: hasta 6 indicadores, los mas reveladores. label de 20 caracteres como maximo, value formateado (por ejemplo "87%"), detail de una linea (por ejemplo "6 de 7 quizzes aprobados").
- strengths: 2-4, cada uno citando una metrica concreta.
- opportunities: 2-4, cada una nombrando la brecha exacta.
- recommendations: 3-5 acciones especificas: que hacer, con que frecuencia y para cuando.
- nextSteps: hasta 4 bloques con titulo de categoria (por ejemplo "Esta semana", "Cursos", "SofLIA") y 2-4 microtareas que el alumno pueda hacer ya.`

const ANALYSIS_RULES = `## Como analizar

- Cita siempre cifras concretas: "completaste 3 de 5 cursos", no "vas bien".
- Cruza metricas entre si para encontrar patrones. Por ejemplo, uso alto de SofLIA junto a baja tasa de aprobado en actividades sugiere dependencia del asistente.
- Identifica 1-2 fortalezas principales y 1-2 areas de mejora de mayor impacto.
- Si un dato clave es cero o falta (sin sesiones, sin actividades), reconocelo con honestidad y propon un punto de partida.
- Usa las muestras anonimizadas solo para valorar la calidad de escritura.

No debes:
- Usar frases de animo sin un dato que las respalde ("sigue asi", "vas muy bien").
- Citar textualmente las muestras anonimizadas.
- Deducir rasgos protegidos, identidad, estado medico ni hechos privados.`

const EXAMPLES = `## Ejemplos del nivel de concrecion esperado

- Fortaleza: "Tu adherencia al plan de estudio es del 82%, muy por encima del umbral del 70%."
- Oportunidad: "Solo tomaste notas en el 20% de las lecciones."
- Recomendacion: "Dedica 10 minutos al final de cada leccion a escribir al menos 3 ideas clave en tus notas."`

const REASONING_HINT = `Antes de redactar, identifica los 3 datos mas significativos y los patrones que surgen al cruzarlos. Entrega solo el JSON.`

function resolveLanguage(locale: BusinessUserAnalyticsLocale): string {
  if (locale === 'en') return 'ingles'
  if (locale === 'pt') return 'portugues'
  return 'espanol'
}

export function buildSystemPromptForOpenAi(
  profile: PromptModelProfile,
  locale: BusinessUserAnalyticsLocale,
): string {
  return [
    `Eres SofLIA, coach personal de aprendizaje. Escribe SOLO en ${resolveLanguage(locale)}, de forma directa, cercana y concreta.`,
    'Analiza los datos del alumno y produce un informe de coaching personalizado y basado en evidencia.',
    profile.reasonsInternally ? '' : REASONING_HINT,
    ANALYSIS_RULES,
    CONTENT_RULES,
    EXAMPLES,
    OUTPUT_SCHEMA,
  ]
    .filter(Boolean)
    .join('\n\n')
}
