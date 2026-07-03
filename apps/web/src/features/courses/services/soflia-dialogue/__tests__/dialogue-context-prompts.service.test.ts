import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { buildDialogueEvaluationRecoveryMessage } from '../dialogue-technical-recovery.service'
import { buildEvaluatorPrompt, evaluateDialogueTurn } from '../dialogue-evaluator.service'
import {
  buildTutorPrompt,
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
    const prompt = buildEvaluatorPrompt({
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
    const prompt = buildTutorPrompt({
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
    const prompt = buildEvaluatorPrompt({
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
    const prompt = buildEvaluatorPrompt({
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
    const prompt = buildEvaluatorPrompt({
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

  it('keeps the recovery message pedagogical instead of technical', () => {
    const message = buildDialogueEvaluationRecoveryMessage()

    expect(message).toContain('necesito un poco mas de evidencia')
    expect(message).not.toContain('fallo tecnico')
    expect(message).not.toContain('evaluacion automatica')
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

  it('uses the evaluator feedback locally by default instead of calling the tutor model', async () => {
    const previousFlag = process.env.SOFLIA_DIALOGUE_TUTOR_USE_MODEL
    delete process.env.SOFLIA_DIALOGUE_TUTOR_USE_MODEL

    try {
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
