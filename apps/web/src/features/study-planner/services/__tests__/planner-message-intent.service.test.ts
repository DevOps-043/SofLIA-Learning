import { describe, it, expect } from 'vitest'
import {
  resolvePlannerMessageIntent,
  type PlannerMessageIntentResolution,
} from '../planner-message-intent.service'
import type { StudyPlannerMessage } from '../../types/planner-ui.types'

function makeParams(overrides: {
  message?: string
  lowerMessage?: string
  conversationHistory?: StudyPlannerMessage[]
  hasSavedDistribution?: boolean
}) {
  const message = overrides.message ?? overrides.lowerMessage ?? ''
  return {
    message,
    lowerMessage: overrides.lowerMessage ?? message.toLowerCase(),
    conversationHistory: overrides.conversationHistory ?? [],
    hasSavedDistribution: overrides.hasSavedDistribution ?? false,
  }
}

function assistantMsg(content: string): StudyPlannerMessage {
  return { role: 'assistant', content }
}

function userMsg(content: string): StudyPlannerMessage {
  return { role: 'user', content }
}

describe('resolvePlannerMessageIntent — option detection', () => {
  it('detects "opcion 1"', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'quiero la opcion 1' }))
    expect(result.selectedOptionNumber).toBe(1)
  })

  it('detects "la 2"', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'prefiero la 2' }))
    expect(result.selectedOptionNumber).toBe(2)
  })

  it('detects "primera"', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'me gusta la primera opcion' }))
    expect(result.selectedOptionNumber).toBe(1)
  })

  it('detects "segunda"', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'elige la segunda' }))
    expect(result.selectedOptionNumber).toBe(2)
  })

  it('detects "tercera"', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'selecciono la tercera' }))
    expect(result.selectedOptionNumber).toBe(3)
  })

  it('returns null when no option is mentioned', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'me parece bien' }))
    expect(result.selectedOptionNumber).toBeNull()
  })
})

describe('resolvePlannerMessageIntent — confirming schedules', () => {
  it('detects schedule confirmation when hasSavedDistribution=true and "si"', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'si', hasSavedDistribution: true }))
    expect(result.isConfirmingSchedules).toBe(true)
  })

  it('detects "confirmo" with saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'confirmo', hasSavedDistribution: true }))
    expect(result.isConfirmingSchedules).toBe(true)
  })

  it('does NOT confirm schedules without saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'si', hasSavedDistribution: false }))
    expect(result.isConfirmingSchedules).toBe(false)
  })

  it('does NOT confirm schedules with unrelated message', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'no me gusta', hasSavedDistribution: true }))
    expect(result.isConfirmingSchedules).toBe(false)
  })
})

describe('resolvePlannerMessageIntent — confirming final summary', () => {
  it('detects final summary confirmation for "ok" with saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'ok', hasSavedDistribution: true }))
    expect(result.isConfirmingFinalSummary).toBe(true)
  })

  it('detects "guardar" as final confirmation', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'guardar', hasSavedDistribution: true }))
    expect(result.isConfirmingFinalSummary).toBe(true)
  })

  it('detects "crear plan" as final confirmation', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'crear plan', hasSavedDistribution: true }))
    expect(result.isConfirmingFinalSummary).toBe(true)
  })

  it('does NOT confirm final summary without saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'ok', hasSavedDistribution: false }))
    expect(result.isConfirmingFinalSummary).toBe(false)
  })
})

describe('resolvePlannerMessageIntent — adding schedules', () => {
  it('detects "agrega" with saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'agrega jueves', hasSavedDistribution: true }))
    expect(result.isAddingSchedules).toBe(true)
  })

  it('detects "incluye" with saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'incluye viernes', hasSavedDistribution: true }))
    expect(result.isAddingSchedules).toBe(true)
  })

  it('does NOT detect adding without saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'agrega jueves', hasSavedDistribution: false }))
    expect(result.isAddingSchedules).toBe(false)
  })
})

describe('resolvePlannerMessageIntent — changing target date', () => {
  it('detects "cambiar fecha" with saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'quiero cambiar la fecha limite', hasSavedDistribution: true }))
    expect(result.isChangingTargetDate).toBe(true)
  })

  it('detects "extender limite" with saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'necesito extender el limite', hasSavedDistribution: true }))
    expect(result.isChangingTargetDate).toBe(true)
  })

  it('does NOT detect date change without saved distribution', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'cambiar la fecha', hasSavedDistribution: false }))
    expect(result.isChangingTargetDate).toBe(false)
  })

  it('does NOT detect date change with unrelated message', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'cambiar el horario', hasSavedDistribution: true }))
    expect(result.isChangingTargetDate).toBe(false)
  })
})

describe('resolvePlannerMessageIntent — message enrichment', () => {
  it('passes through original message when no context matches', () => {
    const msg = 'quiero estudiar mas'
    const result = resolvePlannerMessageIntent(makeParams({ message: msg }))
    expect(result.resolvedMessage).toBe(msg)
  })

  it('enriches message when user selects an option after alternatives were offered', () => {
    const history = [
      assistantMsg('Aquí tienes tres opciones de fecha limite y horario para tu plan'),
    ]
    const result = resolvePlannerMessageIntent(makeParams({
      message: 'quiero la opcion 2',
      hasSavedDistribution: false,
      conversationHistory: history,
    }))
    expect(result.resolvedMessage).toContain('SISTEMA')
    expect(result.resolvedMessage).toContain('OPCION 2')
  })

  it('does NOT enrich message when hasSavedDistribution=true (option was already applied)', () => {
    const history = [assistantMsg('Aquí tienes tres alternativas de fecha limite')]
    const result = resolvePlannerMessageIntent(makeParams({
      message: 'quiero la opcion 1',
      hasSavedDistribution: true,
      conversationHistory: history,
    }))
    // With saved distribution, the alternative selection enrichment is skipped
    expect(result.resolvedMessage).not.toContain('SISTEMA')
  })
})

describe('resolvePlannerMessageIntent — accent normalization', () => {
  it('handles accented characters in "sí"', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'sí', hasSavedDistribution: true }))
    expect(result.isConfirmingSchedules).toBe(true)
  })

  it('handles accented "opción"', () => {
    const result = resolvePlannerMessageIntent(makeParams({ message: 'quiero la opción 3' }))
    expect(result.selectedOptionNumber).toBe(3)
  })
})
