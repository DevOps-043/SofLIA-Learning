import { describe, expect, it } from 'vitest'

import {
  ATTEMPT_COOLDOWN_MS,
  attemptWindowStart,
  attemptsInWindow,
  buildAttemptLimitMessage,
  cooldownWindowStart,
  decideWindowedAttempt,
  describeRetryDelay,
  minutesUntilRetry,
  retryAvailableAt,
} from '../attempt-cooldown'
import { ATTEMPT_COOLDOWN_HOURS } from '../attempt-limits'

const NOW = new Date('2026-08-03T12:00:00.000Z')

describe('ventana de enfriamiento', () => {
  it('dura exactamente ATTEMPT_COOLDOWN_HOURS', () => {
    expect(ATTEMPT_COOLDOWN_MS).toBe(ATTEMPT_COOLDOWN_HOURS * 60 * 60 * 1000)
    expect(ATTEMPT_COOLDOWN_HOURS).toBe(1)
  })

  it('arranca una hora antes del momento actual', () => {
    expect(cooldownWindowStart(NOW)).toBe('2026-08-03T11:00:00.000Z')
  })

  it('se acorta cuando hay un desbloqueo más reciente', () => {
    expect(attemptWindowStart(NOW, '2026-08-03T11:30:00.000Z')).toBe('2026-08-03T11:30:00.000Z')
  })

  it('ignora un desbloqueo anterior a la ventana', () => {
    expect(attemptWindowStart(NOW, '2026-08-01T00:00:00.000Z')).toBe('2026-08-03T11:00:00.000Z')
  })
})

describe('attemptsInWindow', () => {
  it('descarta los intentos fuera de la ventana y ordena del más antiguo al más nuevo', () => {
    const result = attemptsInWindow(
      [
        '2026-08-03T11:45:00.000Z',
        '2026-08-03T10:00:00.000Z', // fuera
        '2026-08-03T11:10:00.000Z',
        null,
      ],
      cooldownWindowStart(NOW),
    )

    expect(result).toEqual(['2026-08-03T11:10:00.000Z', '2026-08-03T11:45:00.000Z'])
  })
})

describe('decideWindowedAttempt', () => {
  it('permite el intento cuando queda cupo', () => {
    expect(decideWindowedAttempt(['2026-08-03T11:10:00.000Z'], 3)).toEqual({
      attemptsInWindow: 1,
      attemptsRemaining: 2,
      attemptNumber: 2,
      retryAfterUtc: null,
      isLimitReached: false,
    })
  })

  it('bloquea y devuelve el momento de recuperación del intento más antiguo', () => {
    const decision = decideWindowedAttempt(
      ['2026-08-03T11:10:00.000Z', '2026-08-03T11:30:00.000Z'],
      2,
    )

    expect(decision.isLimitReached).toBe(true)
    expect(decision.attemptsRemaining).toBe(0)
    // El más antiguo (11:10) sale de la ventana a las 12:10.
    expect(decision.retryAfterUtc).toBe('2026-08-03T12:10:00.000Z')
  })
})

describe('mensajes para el alumno', () => {
  it('redondea hacia arriba los minutos restantes', () => {
    expect(minutesUntilRetry('2026-08-03T12:10:30.000Z', NOW)).toBe(11)
  })

  it('nunca anuncia una espera de cero minutos', () => {
    expect(minutesUntilRetry('2026-08-03T11:59:00.000Z', NOW)).toBe(1)
    expect(describeRetryDelay('2026-08-03T11:59:00.000Z', NOW)).toBe('en 1 minuto')
  })

  it('explica el tope y la espera sin depender de la zona horaria', () => {
    const message = buildAttemptLimitMessage(5, retryAvailableAt('2026-08-03T11:30:00.000Z'), NOW)

    expect(message).toBe(
      'Se alcanzo el limite de 5 intentos para esta actividad. Podras volver a intentarlo en 30 minutos.',
    )
  })
})
