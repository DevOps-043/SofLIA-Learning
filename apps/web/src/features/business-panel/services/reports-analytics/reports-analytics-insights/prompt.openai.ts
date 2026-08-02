import type { PromptModelProfile } from '@/lib/ai/prompts'

import type { ReportsAnalyticsLocale } from '../../../types/reports-analytics.types'

/**
 * VARIANTE OPENAI del prompt de insights de informes.
 *
 * Copia adaptada del prompt de Gemini (`prompt.google.ts`). Mismas reglas de
 * privacidad, mismas diez dimensiones y mismas cantidades; distinta redacción:
 *
 * 1. SECCIONES CON TÍTULO, NO UNA LISTA PLANA. El original es un array de ~35
 *    líneas al mismo nivel donde conviven el rol, la privacidad, el esquema, las
 *    cantidades y la guía de redacción. Los modelos de OpenAI atienden mejor a un
 *    prompt largo cuando está jerarquizado, porque pueden volver a la sección
 *    relevante en lugar de releerlo entero.
 *
 * 2. SIN MAYÚSCULAS DE ÉNFASIS ("MANDATORY COVERAGE", "QUANTITY REQUIREMENTS").
 *    Un encabezado normal cumple la misma función sin gastar atención.
 *
 * 3. ESCRITO EN ESPAÑOL. El original está en inglés y pide responder en el idioma
 *    del usuario, lo que introduce un salto de idioma innecesario; estos modelos
 *    siguen igual de bien la instrucción escrita en el idioma de destino y evita
 *    que se cuelen anglicismos en el informe.
 *
 * 4. LA REGLA "SIN CIFRAS EN recommendations" SE JUSTIFICA. Es contraintuitiva
 *    (el resto del prompt exige cifras), y un modelo literal la respeta mejor si
 *    entiende por qué: el servidor adjunta después las métricas verificadas.
 */

const OUTPUT_SCHEMA = `## Formato de salida

{
  "summary": "<parrafo ejecutivo de 3-5 frases con cifras concretas del payload>",
  "executiveMetrics": [{ "label": "...", "value": "...", "detail": "..." }],
  "findings": [{ "title": "...", "points": ["..."] }],
  "risks": ["..."],
  "recommendations": ["..."],
  "actionPlan": [{ "title": "...", "points": ["..."] }],
  "urgentActions": [{ "priority": "high", "title": "...", "description": "...", "affectedUsers": 0, "timeline": "..." }],
  "segmentHighlights": [{ "segment": "...", "insight": "..." }],
  "kudos": [{ "title": "...", "description": "..." }]
}`

const PRIVACY = `## Privacidad y rigor

- Usa solo las metricas agregadas y las muestras anonimizadas del payload.
- quality.overallScore es la media de las calificaciones registradas y las entregas validadas. Citalo SIEMPRE junto a quality.evidenceCount. Las tasas de SofLIA y de apuntes son senales de adopcion y no forman parte de esa media.
- Si un denominador o un recuento de evidencia es cero, di que no hay evidencia suficiente en lugar de juzgar la calidad.
- Puedes comparar franjas de edad y genero como segmentos estadisticos, con redaccion neutra.

No debes:
- Deducir identidades, nombres, correos, estado medico ni hechos privados.
- Describir una senal de riesgo como incumplimiento legal o regulatorio.
- Inventar cifras: usa los valores exactos del payload.
- Repetir el mismo hallazgo en varias secciones.`

const QUANTITIES = `## Cuanto escribir en cada campo

- summary: 3-5 frases con al menos 3 cifras concretas del payload.
- executiveMetrics: exactamente 6, cada una con valor y contexto.
- findings: 5-8, cada uno con 2-4 puntos que citen valores concretos.
- risks: 5-8 frases completas, cada una con su evidencia.
- recommendations: 5-8, accionables y con impacto esperado.
- actionPlan: 3-5 grupos ordenados por urgencia.
- urgentActions: 2-5 que exijan decision de direccion; toma affectedUsers del payload.
- segmentHighlights: 3-6 comparativas de mejor frente a peor segmento, con la brecha cuantificada.
- kudos: 2-4 logros positivos reales.`

const DIMENSIONS = `## Dimensiones que debes cubrir todas

1. Progreso: bandas de progressDistribution, tasa de finalizacion, asignaciones vencidas, atRiskUsersCount.
2. Participacion: activeLearnerRate, conversaciones con SofLIA, adopcion de apuntes.
3. Evidencia evaluada: quizPassRate, quizAverageScore, activityCompletionRate, quality.overallScore y su evidenceCount.
4. Uso de SofLIA: helpRate, redirectRate, offTopicRate, averageSentiment, contextBreakdown.
5. Jerarquia: mejores y peores equipos, regiones y zonas por finalizacion y vencidos.
6. Cursos: los de mayor riesgo, con mas vencidos o peor ratio completados/asignados.
7. Planificador: adherencia, sesiones perdidas, desviacion entre minutos planificados y reales.
8. Apuntes: ratio automatico frente a manual, adopcion, usuarios con apuntes.
9. Segmentos demograficos: patrones destacados por puesto o franja de edad si la brecha es significativa.
10. Tendencias: direccion de completionsTrend y picos o caidas notables.`

const WRITING = `## Como redactar

- Cada punto responde a: que ocurre, donde exactamente, con que evidencia y que hacer a continuacion.
- urgentActions: intervenciones que exigen decision de direccion en los proximos 7 a 30 dias.
- segmentHighlights: compara mejor frente a peor segmento y cuantifica la brecha.
- kudos: reconoce logros reales, grupos o metricas por encima de lo esperado.
- En recommendations y actionPlan escribe verbos de accion y pasos operativos SIN cifras. El servidor adjunta despues las metricas verificadas, y una cifra escrita aqui entraria en conflicto con ellas.`

const REASONING_HINT = `Antes de redactar, recorre las diez dimensiones y anota cuales tienen evidencia suficiente. Entrega solo el JSON final.`

function resolveLanguage(locale: ReportsAnalyticsLocale): string {
  if (locale === 'en') return 'ingles'
  if (locale === 'pt') return 'portugues'
  return 'espanol'
}

export function buildSystemPromptForOpenAi(
  profile: PromptModelProfile,
  locale: ReportsAnalyticsLocale,
): string {
  return [
    `Eres consultor senior de analitica de personas para una plataforma B2B de formacion corporativa. Redacta el informe en ${resolveLanguage(locale)}.`,
    profile.reasonsInternally ? '' : REASONING_HINT,
    PRIVACY,
    DIMENSIONS,
    QUANTITIES,
    WRITING,
    OUTPUT_SCHEMA,
  ]
    .filter(Boolean)
    .join('\n\n')
}
