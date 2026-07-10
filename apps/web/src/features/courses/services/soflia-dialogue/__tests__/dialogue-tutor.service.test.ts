import { describe, expect, it, vi } from 'vitest'

// Isolate the tutor unit: no Gemini client nor org-context loading in tests.
vi.mock('@/lib/gemini/client', () => ({
  generateGeminiText: vi.fn(),
  getGeminiApiKey: () => '',
  resolveGeminiModel: () => 'test-model',
}))
vi.mock('@/lib/lia-context/services/organization-ai-context.service', () => ({
  buildOrganizationAiContextPromptSection: () => '',
}))

import {
  generateDialogueTutorMessage,
  selectDialogueProbe,
  stripRepeatedTutorContent,
} from '../dialogue-tutor.service'
import type { DialogueTurnRow } from '../dialogue-table-rows'
import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
  DialoguePolicyDecision,
} from '../../../types/dialogue-runtime'

const FIRST_QUESTION =
  '¿Que riesgo concreto identificas en este escenario y por que?'
const SECOND_QUESTION =
  '¿Como mitigarias ese riesgo con un paso accionable esta semana?'

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
  challengePrompts: [FIRST_QUESTION, SECOND_QUESTION],
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
  overrides: Partial<DialogueEvaluationResult> = {},
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

const probePolicy: DialoguePolicyDecision = {
  nextState: 'CHALLENGE_OR_PROBE',
  nextAction: 'probe',
  reason: 'Faltan criterios.',
  shouldComplete: false,
  shouldPersistResult: false,
  hintToUse: null,
}

function assistantTurn(content: string, turnNumber: number): DialogueTurnRow {
  return {
    turn_id: `turn-${turnNumber}`,
    session_id: 'session-1',
    role: 'assistant',
    content,
    turn_number: turnNumber,
    client_turn_id: null,
    state_before: null,
    state_after: null,
    metadata: null,
    created_at: new Date().toISOString(),
  }
}

function userTurn(content: string, turnNumber: number): DialogueTurnRow {
  return { ...assistantTurn(content, turnNumber), role: 'user' }
}

describe('stripRepeatedTutorContent', () => {
  it('removes a sentence already said in a previous assistant turn', () => {
    const result = stripRepeatedTutorContent(
      `Buen punto sobre el contexto. ${FIRST_QUESTION}`,
      [FIRST_QUESTION],
    )
    expect(result).toBe('Buen punto sobre el contexto.')
  })

  it('removes fragments contained in previous assistant messages', () => {
    const result = stripRepeatedTutorContent(
      `Considera el impacto. Que riesgo concreto identificas en este escenario y por que.`,
      [`Te pregunto: ${FIRST_QUESTION} Tomate tu tiempo.`],
    )
    expect(result).toBe('Considera el impacto.')
  })

  it('ignores case, accents and punctuation when matching repeats', () => {
    const result = stripRepeatedTutorContent(
      '¿QUÉ RIESGO CONCRETO IDENTIFICAS EN ESTE ESCENARIO Y POR QUÉ?',
      ['que riesgo concreto identificas en este escenario y por que'],
    )
    expect(result).toBe('')
  })

  it('keeps novel content and short generic phrases', () => {
    const result = stripRepeatedTutorContent(
      `Bien. Ahora explica la consecuencia de tu decision en el equipo.`,
      [FIRST_QUESTION],
    )
    expect(result).toContain('explica la consecuencia')
    expect(result).toContain('Bien.')
  })

  it('removes short questions repeated verbatim as a full sentence', () => {
    const result = stripRepeatedTutorContent(
      'Buen avance en tu argumento. ¿Que opinas?',
      ['Piensa en el caso. ¿Que opinas?'],
    )
    expect(result).toBe('Buen avance en tu argumento.')
  })

  it('keeps short questions that were never asked before', () => {
    const result = stripRepeatedTutorContent(
      'Buen avance en tu argumento. ¿Y el costo?',
      ['Piensa en el caso. ¿Que opinas?'],
    )
    expect(result).toContain('¿Y el costo?')
  })

  it('does not treat a short phrase inside a longer sentence as a repeat', () => {
    // "el riesgo" appears inside previous content but only as a fragment of a
    // longer sentence; short fragments must not trigger the filter.
    const result = stripRepeatedTutorContent(
      'Nombra el riesgo.',
      ['Analiza con calma cual seria el riesgo principal de tu propuesta y su impacto.'],
    )
    expect(result).toBe('Nombra el riesgo.')
  })

  it('returns the candidate untouched when there is no history', () => {
    expect(stripRepeatedTutorContent(FIRST_QUESTION, [])).toBe(FIRST_QUESTION)
  })
})

describe('selectDialogueProbe', () => {
  it('uses the first challenge prompt when none has been asked', () => {
    const probe = selectDialogueProbe({
      config,
      evaluation: evaluation(),
      previousAssistantContents: [],
    })
    expect(probe).toContain('riesgo concreto identificas')
  })

  it('rotates to the next unused challenge prompt instead of repeating', () => {
    const probe = selectDialogueProbe({
      config,
      evaluation: evaluation(),
      previousAssistantContents: [`Gracias por tu respuesta. ${FIRST_QUESTION}`],
    })
    expect(probe).toContain('mitigarias ese riesgo')
    expect(probe).not.toContain('riesgo concreto identificas')
  })

  it('falls back to a criterion probe when all challenge prompts were asked', () => {
    const probe = selectDialogueProbe({
      config,
      evaluation: evaluation(),
      previousAssistantContents: [FIRST_QUESTION, SECOND_QUESTION],
    })
    expect(probe).toContain('Riesgo')
    expect(probe).not.toContain('riesgo concreto identificas')
  })

  it('rotates short challenge prompts too (exact sentence repeats at any length)', () => {
    const shortPromptsConfig: DialogueActivityConfig = {
      ...config,
      challengePrompts: ['¿Que opinas?', '¿Y el costo?'],
    }
    const probe = selectDialogueProbe({
      config: shortPromptsConfig,
      evaluation: evaluation(),
      previousAssistantContents: ['Gracias por tu respuesta. ¿Que opinas?'],
    })
    expect(probe).toContain('¿Y el costo?')
  })
})

describe('generateDialogueTutorMessage (fallback path)', () => {
  it('never re-shows a previous question mixed into the current message', async () => {
    // Reproduces the reported bug: the evaluator feedback echoes SofLIA's
    // previous question, and the first challenge prompt was already asked.
    const message = await generateDialogueTutorMessage({
      config,
      evaluation: evaluation({
        feedbackForTutor: `Te falto profundidad. ${FIRST_QUESTION}`,
      }),
      policy: probePolicy,
      recentTurns: [
        assistantTurn(`Bienvenido. ${FIRST_QUESTION}`, 1),
        userTurn('Creo que el riesgo es perder clientes.', 2),
      ],
    })

    expect(message).not.toContain('riesgo concreto identificas')
    expect(message).toContain('Te falto profundidad.')
    expect(message).toContain('mitigarias ese riesgo')
  })

  it('keeps working normally on the first probe (no history to collide with)', async () => {
    const message = await generateDialogueTutorMessage({
      config,
      evaluation: evaluation({ feedbackForTutor: 'Buen inicio.' }),
      policy: probePolicy,
      recentTurns: [userTurn('Mi primera respuesta.', 1)],
    })

    expect(message).toContain('Buen inicio.')
    expect(message).toContain('riesgo concreto identificas')
  })
})
