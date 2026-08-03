import { buildPromptModelProfile } from '@/lib/ai/prompts'

import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { buildDialogueEvaluationRecoveryMessage } from '../dialogue-technical-recovery.service'
import { evaluateDialogueTurn } from '../dialogue-evaluator.service'
import { buildEvaluatorPromptForGoogle } from '../dialogue-evaluator.google.prompt'
import { buildTutorPromptForGoogle } from '../dialogue-tutor.google.prompt'
import {
  generateDialogueTutorMessage,
  normalizeTutorMessageForDisplay,
  resolveDialogueTutorMaxOutputTokens,
} from '../dialogue-tutor.service'
import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
  DialoguePolicyDecision,
} from '../../../types/dialogue-runtime'
import type { ResolvedOrganizationAiContext } from '@/lib/lia-context/services/organization-ai-context.service'

const config: DialogueActivityConfig = {
  interactionType: 'soflia_dialogue',
  runtimeType: 'SOFLIA_DIALOGUE',
  schemaVersion: '1.0.0',
  visibleGoal: 'Justificar una decision aplicada.',
  scenario: 'Caso de adopcion de IA en marketing.',
  openingMessage: 'Que harias y por que?',
  successCriteria: [{ id: 'impact', label: 'Impacto', required: true }],
  expectedEvidence: [],
  commonMistakes: [],
  hintLadder: [],
  challengePrompts: [],
  contextAdaptation: {
    enabled: true,
    focus: ['industry', 'scale'],
    instructions: 'Aterriza la conversacion a decisiones de marketing.',
  },
  rescueContent: 'Una respuesta solida conecta accion, impacto y riesgo.',
  rubric: [{ id: 'business-fit', label: 'Ajuste al negocio', weight: 100 }],
  policy: {
    approvalMinimum: 75,
    maxTurns: 8,
    maxHints: 2,
    rescueAfterLowEvidenceTurns: 2,
    allowRetry: true,
  },
  tutor: { tone: 'direct_supportive', maxResponseSentences: 4 },
  evaluator: { promptVersion: 'DIALOGUE_EVALUATOR_RUNTIME@1.0.0' },
  analytics: { trackEvents: [] },
  versioning: { rubricVersion: '1.0.0' },
}

const organizationAiContext: ResolvedOrganizationAiContext = {
  organizationId: 'org-1',
  organizationName: 'Acme Retail',
  organizationSlug: 'acme-retail',
  userJobTitle: 'Marketing Manager',
  organizationIndustry: 'Retail',
  organizationSize: '51-200',
  organizationType: 'B2B',
  organizationCountry: 'Mexico',
}

const evaluation: DialogueEvaluationResult = {
  overallScore: 45,
  decision: 'partial_continue',
  recommendedNextState: 'CHALLENGE_OR_PROBE',
  dimensionScores: [],
  criteriaMet: [],
  criteriaMissing: ['impact'],
  flags: {
    keywordStuffing: false,
    promptInjection: false,
    evasiveAnswer: false,
    contradiction: false,
    memorizedWithoutLogic: false,
  },
  feedbackForTutor: 'Debe aterrizar el impacto operativo.',
  backendNotes: '',
  evidenceQuotes: [],
}

const policy: DialoguePolicyDecision = {
  nextState: 'CHALLENGE_OR_PROBE',
  nextAction: 'ask_probe',
  reason: 'Falta evidencia.',
  shouldComplete: false,
  shouldPersistResult: false,
  hintToUse: null,
}



describe('dialogue organization context prompts', () => {
  it('adds verified organization context to evaluator prompt', () => {
    const prompt = buildEvaluatorPromptForGoogle({
      config,
      organizationAiContext,
      previousEvaluations: [],
      recentTurns: [],
      studentMessage: 'Usaria IA para segmentar clientes.',
    })

    expect(prompt).toContain('CONTEXTO EMPRESARIAL VERIFICADO')
    expect(prompt).toContain('Acme Retail')
    expect(prompt).toContain('Marketing Manager')
    expect(prompt).toContain('Retail')
    expect(prompt).toContain('industry, scale')
  })

  it('adds verified organization context to tutor prompt', () => {
    const prompt = buildTutorPromptForGoogle({
      config,
      evaluation,
      organizationAiContext,
      policy,
      recentTurns: [],
    })

    expect(prompt).toContain('CONTEXTO EMPRESARIAL VERIFICADO')
    expect(prompt).toContain('Acme Retail')
    expect(prompt).toContain('Aterriza la conversacion')
    expect(prompt).toContain('No reveles')
    expect(prompt).toContain('Cierra siempre con una frase completa')
  })

  it('calibrates the evaluator to grade concepts, never literal wording from the video', () => {
    const prompt = buildEvaluatorPromptForGoogle({
      config,
      organizationAiContext,
      previousEvaluations: [],
      recentTurns: [],
      studentMessage: 'Usaria IA para segmentar clientes.',
    })

    expect(prompt).toContain('COMPRENSION CONCEPTUAL, no memoria textual')
    expect(prompt).toContain('NUNCA exijas la redaccion')
    expect(prompt).toContain('EJEMPLOS DE REFERENCIA')
    expect(prompt).toContain('decide a favor del estudiante')
    expect(prompt).not.toContain('evaluador estricto')
  })

  it('pins accumulated criteria from earlier turns into the evaluator prompt', () => {
    const prompt = buildEvaluatorPromptForGoogle({
      accumulatedCriteriaMet: ['impact'],
      config,
      organizationAiContext,
      previousEvaluations: [],
      recentTurns: [],
      studentMessage: 'Usaria IA para segmentar clientes.',
    })

    expect(prompt).toContain('Criterios ya confirmados en turnos anteriores')
    expect(prompt).toContain('["impact"]')
  })

  it('asks the evaluator for student-facing feedback to avoid a second tutor call', () => {
    const prompt = buildEvaluatorPromptForGoogle({
      config,
      organizationAiContext,
      previousEvaluations: [],
      recentTurns: [],
      studentMessage: 'Usaria IA para segmentar clientes.',
    })

    expect(prompt).toContain('feedbackForTutor debe ser un mensaje visible para el estudiante')
    expect(prompt).toContain('maximo 2 frases')
    expect(prompt).toContain('siguiente paso concreto')
  })

  it('classifies evasive short answers locally without calling Gemini', async () => {
    await expect(
      evaluateDialogueTurn({
        config,
        organizationAiContext,
        previousEvaluations: [],
        recentTurns: [],
        studentMessage: 'no sé',
      }),
    ).resolves.toMatchObject({
      evaluation: {
        decision: 'low_evidence',
        flags: { evasiveAnswer: true },
        overallScore: 0,
        recommendedNextState: 'HINT',
      },
      modelName: 'local-low-evidence-classifier',
    })
  })

  /**
   * Este caso comprobaba lo contrario: que el mensaje sonara pedagógico y
   * ocultara el fallo técnico. Esa decisión es la que produjo la incidencia
   * real —el alumno leía "necesito mas evidencia" tras una respuesta correcta,
   * la reescribía en bucle y el docente concluía que SofLIA calificaba mal—
   * cuando en realidad la evaluación nunca llegó a ejecutarse.
   */
  it('never blames the student for a technical failure', () => {
    const message = buildDialogueEvaluationRecoveryMessage()

    expect(message.toLowerCase()).toContain('tecnico')
    expect(message.toLowerCase()).toContain('no por lo que escribiste')
    // Ninguna insinuación de que la respuesta del alumno fuera insuficiente.
    expect(message.toLowerCase()).not.toContain('mas evidencia')
  })

  it('falls back when the tutor message looks truncated', () => {
    expect(
      normalizeTutorMessageForDisplay(
        'Vas bien porque conectaste el caso, pero',
        'Mensaje completo de respaldo.',
      ),
    ).toBe('Mensaje completo de respaldo.')

    expect(
      normalizeTutorMessageForDisplay(
        'Es muy cierto que esos factores presionan fuertemente los margenes en el',
        'Mensaje completo de respaldo.',
      ),
    ).toBe('Mensaje completo de respaldo.')
  })

  it('uses a larger tutor output budget to avoid incomplete answers', () => {
    expect(resolveDialogueTutorMaxOutputTokens(config)).toBeGreaterThan(500)
  })

  it('calibra los ejemplos al cargo del estudiante', () => {
    const prompt = buildTutorPromptForGoogle({
      config,
      evaluation,
      organizationAiContext,
      policy,
      recentTurns: [],
    })

    expect(prompt).toContain('Regla de rol')
    expect(prompt).toContain('alcance de decision real de un Marketing Manager')
    // El contexto elige el ejemplo; no se menciona el cargo en cada mensaje.
    expect(prompt).toContain('No nombres el cargo ni la empresa en cada mensaje')
  })

  it('prohibe inventar datos de empresa que no esten en el contexto', () => {
    const prompt = buildEvaluatorPromptForGoogle({
      config,
      organizationAiContext: {
        organizationId: 'org-2',
        organizationName: 'Pulse Hub',
        organizationSlug: 'pulse-hub',
        userJobTitle: 'COO',
      },
      previousEvaluations: [],
      recentTurns: [],
      studentMessage: 'Delegaria la busqueda de informacion.',
    })

    expect(prompt).toContain('Regla de veracidad')
    expect(prompt).toContain('no inventes datos de la empresa')
    // Sin datos de empresa cargados, el cargo sigue disponible para adaptar.
    expect(prompt).toContain('alcance de decision real de un COO')
  })

  it('omite las reglas de rol cuando la membresia no tiene cargo', () => {
    const prompt = buildTutorPromptForGoogle({
      config,
      evaluation,
      organizationAiContext: {
        organizationId: 'org-3',
        organizationName: 'Sin Cargos',
        organizationSlug: 'sin-cargos',
      },
      policy,
      recentTurns: [],
    })

    expect(prompt).toContain('CONTEXTO EMPRESARIAL VERIFICADO')
    expect(prompt).not.toContain('Regla de rol')
  })

  it('genera el mensaje del tutor con el modelo salvo que se apague explicitamente', async () => {
    const previousFlag = process.env.SOFLIA_DIALOGUE_TUTOR_USE_MODEL

    try {
      // Interruptor de emergencia: vuelve a las plantillas locales.
      process.env.SOFLIA_DIALOGUE_TUTOR_USE_MODEL = 'false'

      await expect(
        generateDialogueTutorMessage({
          config,
          evaluation: {
            ...evaluation,
            feedbackForTutor: 'Debes aterrizar el impacto operativo en una decision concreta.',
          },
          organizationAiContext,
          policy,
          recentTurns: [],
        }),
      ).resolves.toContain('aterrizar el impacto operativo')
    } finally {
      if (previousFlag === undefined) {
        delete process.env.SOFLIA_DIALOGUE_TUTOR_USE_MODEL
      } else {
        process.env.SOFLIA_DIALOGUE_TUTOR_USE_MODEL = previousFlag
      }
    }
  })
})
