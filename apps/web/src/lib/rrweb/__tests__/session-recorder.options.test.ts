import type { eventWithTime } from '@rrweb/types'
import { describe, expect, it } from 'vitest'
import { buildSessionRecorderRecordOptions } from '../session-recorder.options'

describe('session recorder options', () => {
  it('creates rrweb options and appends emitted events', () => {
    let events: eventWithTime[] = []
    let initialSnapshot: eventWithTime | null = null

    const options = buildSessionRecorderRecordOptions({
      isDev: false,
      getEvents: () => events,
      maxEvents: 3,
      getInitialSnapshot: () => initialSnapshot,
      setEvents: (nextEvents) => {
        events = nextEvents
      },
      setInitialSnapshot: (nextSnapshot) => {
        initialSnapshot = nextSnapshot
      },
    })

    options.emit?.({ type: 2, timestamp: 10 } as eventWithTime)
    expect(events).toHaveLength(1)
    expect(initialSnapshot?.type).toBe(2)
    expect(options.maskInputOptions?.password).toBe(true)
  })
})
