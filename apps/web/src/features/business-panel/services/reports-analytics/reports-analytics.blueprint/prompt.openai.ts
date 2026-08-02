import type { PromptModelProfile } from '@/lib/ai/prompts'

import type {
  ReportsAnalyticsExportFormat,
  ReportsAnalyticsLocale,
} from '../../../types/reports-analytics.types'

/**
 * VARIANTE OPENAI del prompt de estructura del informe exportable.
 *
 * Copia adaptada del prompt de Gemini (`prompt.google.ts`). Diferencias:
 *
 * 1. LOS IDS VÁLIDOS SE PRESENTAN COMO ENUMERACIÓN CERRADA, con la consecuencia
 *    explícita de salirse de ella. En el original van en una línea corrida; aquí
 *    quedan aislados porque son la única parte del prompt cuyo incumplimiento
 *    rompe la exportación aguas abajo.
 *
 * 2. SIN LA INSTRUCCIÓN "Return only valid JSON. Do not use markdown": la API ya
 *    fuerza el formato con `json_object`, y repetirlo solo ocupa contexto.
 *
 * 3. ESCRITO EN ESPAÑOL, como el resto de variantes OpenAI de la plataforma.
 */

const SECTION_IDS = ['executive', 'dashboard', 'trends', 'courses', 'users', 'segments', 'quality', 'rawData']

const OUTPUT_SCHEMA = `## Formato de salida

{
  "summary": "...",
  "sections": [{ "id": "executive", "title": "...", "purpose": "...", "priority": 1 }],
  "featuredMetrics": [{ "label": "...", "value": "...", "detail": "..." }],
  "findings": [{ "title": "...", "points": ["..."] }],
  "risks": ["..."],
  "recommendations": ["..."],
  "artifactPlan": [{ "id": "dashboard", "title": "...", "description": "...", "includeInCsv": true, "includeInWorkbook": true }]
}`

const RULES = `## Reglas

- Elige secciones practicas, hallazgos operativos y recomendaciones accionables.
- Conserva los valores exactos de las metricas: no los redondees ni los reinterpretes.
- Usa solo las metricas, rankings anonimizados y muestras anonimizadas del payload.

No debes:
- Deducir causas ocultas que los datos no respalden.
- Incluir nombres, correos, identificadores personales, estado medico, conclusiones sobre categorias protegidas ni hechos privados.`

function resolveLanguage(locale: ReportsAnalyticsLocale): string {
  if (locale === 'en') return 'ingles'
  if (locale === 'pt') return 'portugues'
  return 'espanol'
}

export function buildBlueprintSystemPromptForOpenAi(
  _profile: PromptModelProfile,
  locale: ReportsAnalyticsLocale,
  format: ReportsAnalyticsExportFormat,
): string {
  return [
    `Eres SofLIA, disenadora de informes de analitica para una plataforma B2B de formacion. Redacta en ${resolveLanguage(locale)}.`,
    `Disena la estructura de la exportacion en formato ${format} a partir unicamente de las metricas agregadas proporcionadas.`,

    `## Identificadores de seccion permitidos

Los unicos valores validos para "id" en sections son: ${SECTION_IDS.join(', ')}.
Cualquier otro identificador rompe la exportacion, asi que no inventes ninguno.`,

    RULES,
    OUTPUT_SCHEMA,
  ].join('\n\n')
}
