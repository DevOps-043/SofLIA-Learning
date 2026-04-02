import { describe, expect, it } from 'vitest'
import {
  buildDefaultProposedSlots,
  detectScheduleChangeRequest,
  detectStudyScheduleConfig,
} from '../study-schedule.service'

describe('study-schedule.service', () => {
  it('detects schedule changes with am/pm expressions', () => {
    expect(detectScheduleChangeRequest('prefiero moverlo a las 10:30 am')).toEqual({
      isScheduleChange: true,
      proposedTime: '10:30am',
    })
  })

  it('detects study days and time slots with or without accents', () => {
    expect(
      detectStudyScheduleConfig('Puedo estudiar lunes y miercoles por la manana')
    ).toEqual({
      detected: true,
      studyDays: ['lunes', 'miércoles'],
      timeSlots: ['mañana'],
    })
  })

  it('builds default proposed slots from the provided date and time', () => {
    expect(
      buildDefaultProposedSlots('09:15am', new Date('2026-04-01T08:00:00.000Z'))
    ).toEqual([
      {
        date: '2026-04-01',
        startTime: '09:15am',
        endTime: '09:00',
      },
    ])
  })
})
