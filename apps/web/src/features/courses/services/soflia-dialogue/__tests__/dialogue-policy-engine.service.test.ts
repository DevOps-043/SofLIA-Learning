import { describe, expect, it } from 'vitest'

import { decideDialogueNextState } from '../dialogue-policy-engine.service'
import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
} from '../../../types/dialogue-runtime'

const config: DialogueActivityConfig = {
  interactionType: 'soflia_dialogue',
  runtimeType: 'SOFLIA_DIALOGUE',
  schemaVersion: '1.0.0',
  visibleGoal: 'Justificar una decision.',
  scenario: 'Caso de negocio.',
  openingMessage: 'Decide y justifica.',
  successCriteria: [
    { id: 'risk', label: 'Riesgo', required: true },
    { id: 'mitigation', label: 'Mitigacion', required: true },
  ],
  expectedEvidence: [],
  commonMistakes: [],
  hintLadder: [
    {
      id: 'hint-1',
      level: 1,
      content: 'Piensa en el riesgo concreto.',
      targetCriterionId: 'risk',
    },
  ],
  challengePrompts: [],
  rescueContent: 'Una respuesta solida conecta riesgo con mitigacion.',
  rubric: [{ id: 'causality', label: 'Causalidad', weight: 50 }],
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

function evaluation(
  overrides: Partial<DialogueEvaluationResult>,
): DialogueEvaluationResult {
  return {
    overallScore: 40,
    decision: 'partial_continue',
    recommendedNextState: 'CHALLENGE_OR_PROBE',
    dimensionScores: [],
    criteriaMet: [],
    criteriaMissing: ['risk', 'mitigation'],
    flags: {
      keywordStuffing: false,
      promptInjection: false,
      evasiveAnswer: false,
      contradiction: false,
      memorizedWithoutLogic: false,
    },
    feedbackForTutor: '',
    backendNotes: '',
    evidenceQuotes: [],
    ...overrides,
  }
}

describe('decideDialogueNextState', () => {
  it('completes only when score and required criteria are satisfied', () => {
    const decision = decideDialogueNextState({
      config,
      currentState: 'EVALUATE_RESPONSE',
      evaluation: evaluation({
        overallScore: 86,
        decision: 'complete',
        criteriaMet: ['risk', 'mitigation'],
        criteriaMissing: [],
      }),
      hintsUsed: 0,
      lowEvidenceTurns: 0,
      turnsCount: 2,
    })

    expect(decision.nextState).toBe('COMPLETE')
    expect(decision.shouldComplete).toBe(true)
  })

  it('uses a hint before rescue when low evidence can still be corrected', () => {
    const decision = decideDialogueNextState({
      config,
      currentState: 'EVALUATE_RESPONSE',
      evaluation: evaluation({ decision: 'low_evidence' }),
      hintsUsed: 0,
      lowEvidenceTurns: 1,
      turnsCount: 2,
    })

    expect(decision.nextState).toBe('HINT')
    expect(decision.hintToUse?.id).toBe('hint-1')
  })

  it('rescues (no loop) when hints are exhausted and there is no progress, even with needs_hint', () => {
    const decision = decideDialogueNextState({
      config,
      currentState: 'CHALLENGE_OR_PROBE',
      evaluation: evaluation({
        decision: 'needs_hint',
        overallScore: 0,
        criteriaMet: [],
        criteriaMissing: ['risk', 'mitigation'],
      }),
      hintsUsed: 2, // agotadas (maxHints = 2)
      lowEvidenceTurns: 0, // needs_hint no incrementa lowEvidenceTurns
      turnsCount: 5,
    })

    expect(decision.nextState).toBe('RESCUE')
  })

  it('keeps probing (not rescue) when hints are exhausted but the student is making progress', () => {
    const decision = decideDialogueNextState({
      config,
      currentState: 'CHALLENGE_OR_PROBE',
      evaluation: evaluation({
        decision: 'needs_hint',
        overallScore: 40,
        criteriaMet: ['risk'],
        criteriaMissing: ['mitigation'],
      }),
      hintsUsed: 2,
      lowEvidenceTurns: 0,
      turnsCount: 5,
    })

    expect(decision.nextState).toBe('CHALLENGE_OR_PROBE')
  })

  it('blocks completion when security flags are present', () => {
    const decision = decideDialogueNextState({
      config,
      currentState: 'EVALUATE_RESPONSE',
      evaluation: evaluation({
        overallScore: 100,
        decision: 'complete',
        criteriaMet: ['risk', 'mitigation'],
        flags: {
          keywordStuffing: false,
          promptInjection: true,
          evasiveAnswer: false,
          contradiction: false,
          memorizedWithoutLogic: false,
        },
      }),
      hintsUsed: 0,
      lowEvidenceTurns: 0,
      turnsCount: 1,
    })

    expect(decision.nextState).toBe('FAIL_OR_RETRY')
    expect(decision.shouldComplete).toBe(false)
  })
})
