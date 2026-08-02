import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Guardia del invariante central del diseño: los prompts de Gemini están
 * CONGELADOS.
 *
 * Cada `*.google*.ts` es el texto original, calibrado con uso real. La razón de
 * separar variantes es que un ajuste para OpenAI no pueda degradar, sin querer,
 * el comportamiento ya validado en Gemini. Esta prueba comprueba que esas
 * variantes siguen conteniendo las marcas de redacción del original: si alguien
 * las "moderniza" o las unifica con la variante de OpenAI, falla aquí.
 */

const SRC = join(__dirname, '..', '..', '..', '..')

interface FrozenPrompt {
  /** Fragmentos textuales que solo existen en la redacción original. */
  markers: string[]
  path: string
}

const FROZEN_PROMPTS: FrozenPrompt[] = [
  {
    markers: [
      '## OVERRIDE DE FLUJO PARA REPORTES TECNICOS',
      'PROHIBIDO ABSOLUTAMENTE usar emojis',
      'REGLA DE ORO',
    ],
    path: 'app/api/lia/chat/prompt-base.google.ts',
  },
  {
    markers: [
      'COMPRENSION CONCEPTUAL, no memoria textual',
      'NUNCA exijas la redaccion',
      'EJEMPLOS DE REFERENCIA',
    ],
    path: 'features/courses/services/soflia-dialogue/dialogue-evaluator.google.prompt.ts',
  },
  {
    markers: ['No acredites ni repruebes por tu cuenta'],
    path: 'features/courses/services/soflia-dialogue/dialogue-tutor.google.prompt.ts',
  },
  {
    markers: ['No agregues markdown, texto extra ni bloques de codigo'],
    path: 'features/courses/services/activity-validation.google.prompt.ts',
  },
  {
    markers: ['MANDATORY COVERAGE', 'QUANTITY REQUIREMENTS'],
    path: 'features/business-panel/services/reports-analytics/reports-analytics-insights/prompt.google.ts',
  },
  {
    markers: ['DATA YOU WILL RECEIVE'],
    path: 'features/business-panel/services/business-user-analytics/business-user-analytics.insights/prompt.google.ts',
  },
  {
    markers: ['mu3rt3', 'leetspeak'],
    path: 'lib/ai-moderation/ai-system-prompt.google.ts',
  },
  {
    markers: ['PERITO FORENSE DIGITAL', 'concurrentSessions'],
    path: 'features/admin/services/user-forensics/user-forensics.google.prompt.ts',
  },
  {
    markers: ['NUNCA reveles la respuesta correcta directamente'],
    path: 'app/api/courses/[slug]/lessons/[lessonId]/quiz/feedback-prompt.google.ts',
  },
  {
    markers: ['heuristicMinutes y las senales incluidas son apoyo tecnico secundario'],
    path: 'features/admin/services/course-time-estimation-service/system-prompt.google.ts',
  },
  {
    markers: ['No saludes, no te presentes, no añadas prefacio ni cierre.'],
    path: 'app/api/lia/lesson-suggestions/lesson-suggestions.google.prompt.ts',
  },
  {
    markers: ['Eres el motor de enriquecimiento del Libro de Apuntes', '<apunte>'],
    path: 'features/notebook/services/notebook-enrichment.google.prompt.ts',
  },
  {
    markers: ['Learning Efficiency Factor', 'HARD DATA'],
    path: 'app/api/_lib/deadline-suggestions/deadline-prompt.google.ts',
  },
  {
    markers: ['Genera la síntesis de estudio de un curso completado'],
    path: 'features/courses/services/course-compendium.google.prompt.ts',
  },
  {
    markers: ['Genera un apunte automatico de leccion'],
    path: 'features/courses/services/lesson-auto-note.google.prompt.ts',
  },
  {
    // Los prompts cortos comparten módulo: la variante congelada es la `*ForGoogle`.
    markers: [
      'Eres un detector de idiomas especializado',
      'Eres un traductor profesional especializado',
    ],
    path: 'core/services/ai-small-prompts.ts',
  },
  {
    markers: ['Eres un clasificador de intenciones para una plataforma educativa'],
    path: 'app/api/ai-intent/intent-prompt.ts',
  },
]

describe('los prompts de Gemini estan congelados', () => {
  it.each(FROZEN_PROMPTS)('$path conserva su redaccion original', ({ markers, path }) => {
    const source = readFileSync(join(SRC, path), 'utf8')

    for (const marker of markers) {
      expect(source).toContain(marker)
    }
  })
})
