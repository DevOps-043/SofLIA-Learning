import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setCurrentTimezone } from '../format.utils'
import {
  findAlternativeSlots,
  isWorkBlockEvent,
} from '../analysis-slots.service'

describe('analysis-slots.service', () => {
  beforeEach(() => {
    setCurrentTimezone('America/Mexico_City')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-20T08:00:00-06:00'))
  })

  it('detects work blocks by duration and title', () => {
    expect(
      isWorkBlockEvent({
        title: 'Bloque de trabajo',
        start: '2026-04-21T09:00:00-06:00',
        end: '2026-04-21T13:00:00-06:00',
      }),
    ).toBe(true)

    expect(
      isWorkBlockEvent({
        title: 'Reunion de trabajo',
        start: '2026-04-21T09:00:00-06:00',
        end: '2026-04-21T10:00:00-06:00',
      }),
    ).toBe(false)
  })

  it('suggests free slots inside work blocks before generic windows', () => {
    const alternatives = findAlternativeSlots(
      new Date('2026-04-20T08:00:00-06:00'),
      60,
      [
        {
          id: 'wb-1',
          title: 'Bloque de trabajo',
          start: '2026-04-20T09:00:00-06:00',
          end: '2026-04-20T13:00:00-06:00',
          isAllDay: false,
          isStudySession: false,
        },
        {
          id: 'busy-1',
          title: 'Cita',
          start: '2026-04-20T10:00:00-06:00',
          end: '2026-04-20T11:00:00-06:00',
          isAllDay: false,
          isStudySession: false,
        },
      ],
      [],
    )

    expect(alternatives[0]).toContain('dentro de bloque de trabajo')
  })

  it('falls back to a generic message when no slot is available', () => {
    const alternatives = findAlternativeSlots(
      new Date('2026-04-20T08:00:00-06:00'),
      240,
      Array.from({ length: 15 }, (_, index) => ({
        id: `busy-${index}`,
        title: `Evento largo ${index}`,
        start: new Date(2026, 3, 20 + index, 0, 0, 0).toISOString(),
        end: new Date(2026, 3, 20 + index, 23, 59, 0).toISOString(),
        isAllDay: false,
        isStudySession: false,
      })),
      [],
    )

    expect(alternatives).toEqual(['Revisa tu calendario para encontrar un horario libre'])
  })
})
