import { describe, expect, it } from 'vitest'

import {
  countForensicEventTypes,
  deriveFirstActivityAtUtc,
  deriveLastActivityAtUtc,
  sortForensicEventsDesc,
} from '../user-forensics.timeline'
import type { ForensicEvent } from '../user-forensics.types'

function event(id: string, atUtc: string, type: ForensicEvent['type'] = 'login'): ForensicEvent {
  return { id, type, atUtc, title: id }
}

const EVENTS: ForensicEvent[] = [
  event('login-1', '2026-07-18T14:38:00.000Z', 'login'),
  event('dlg-1', '2026-07-18T16:33:00.000Z', 'dialogue_started'),
  event('quiz-1', '2026-07-18T15:10:00.000Z', 'quiz_attempt'),
  event('quiz-2', '2026-07-18T15:12:00.000Z', 'quiz_attempt'),
]

describe('sortForensicEventsDesc', () => {
  it('orders most recent first', () => {
    const sorted = sortForensicEventsDesc(EVENTS)
    expect(sorted.map((e) => e.id)).toEqual(['dlg-1', 'quiz-2', 'quiz-1', 'login-1'])
  })

  it('does not mutate the input', () => {
    const copy = [...EVENTS]
    sortForensicEventsDesc(EVENTS)
    expect(EVENTS).toEqual(copy)
  })
})

describe('deriveLastActivityAtUtc', () => {
  it('returns the MAX timestamp (real last activity), later than any login', () => {
    // Núcleo del fix "tiempo desigual": la última actividad real es el diálogo a las
    // 16:33, no el login a las 14:38 (que es lo que quedaba en last_activity_at).
    expect(deriveLastActivityAtUtc(EVENTS)).toBe('2026-07-18T16:33:00.000Z')
  })

  it('returns null for no events', () => {
    expect(deriveLastActivityAtUtc([])).toBeNull()
  })
})

describe('deriveFirstActivityAtUtc', () => {
  it('returns the MIN timestamp', () => {
    expect(deriveFirstActivityAtUtc(EVENTS)).toBe('2026-07-18T14:38:00.000Z')
  })
})

describe('countForensicEventTypes', () => {
  it('counts by type, most frequent first', () => {
    const counts = countForensicEventTypes(EVENTS)
    expect(counts[0]).toEqual({ type: 'quiz_attempt', count: 2 })
    expect(counts).toContainEqual({ type: 'login', count: 1 })
    expect(counts).toContainEqual({ type: 'dialogue_started', count: 1 })
  })
})
