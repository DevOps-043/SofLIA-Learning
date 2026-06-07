import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { buildEvaluatorPrompt } from '../dialogue-evaluator.service'
import {
  buildTutorPrompt,
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

  it('falls back when the tutor message looks truncated', () => {
    expect(
      normalizeTutorMessageForDisplay(
        'Vas bien porque conectaste el caso, pero',
        'Mensaje completo de respaldo.',
      ),
    ).toBe('Mensaje completo de respaldo.')
  })

  it('uses a larger tutor output budget to avoid incomplete answers', () => {
    expect(resolveDialogueTutorMaxOutputTokens(config)).toBeGreaterThan(500)
  })
})
