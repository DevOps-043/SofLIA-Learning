import { describe, expect, it } from 'vitest'
import {
  appendRecordedEvent,
  buildRecordingSession,
  createServerSessionRecorderMock,
  getSessionSizeFormatted,
} from '../session-recorder.utils'
import type { RecordingSession } from '../session-recorder.types'

describe('session recorder utils', () => {
  it('keeps snapshot when trimming events', () => {
    const snapshot = { type: 2, timestamp: 1 } as any
    const click = { type: 3, timestamp: 2 } as any
    const input = { type: 3, timestamp: 3 } as any

    const result = appendRecordedEvent({
      events: [snapshot, click],
      event: input,
      maxEvents: 2,
      initialSnapshot: snapshot,
    })

    expect(result.events[0]).toBe(snapshot)
    expect(result.events).toHaveLength(2)
  })

  it('appends in place without cloning the event buffer on each event', () => {
    const snapshot = { type: 2, timestamp: 1 } as any
    const events = [snapshot]
    const click = { type: 3, timestamp: 2 } as any

    const result = appendRecordedEvent({
      events,
      event: click,
      maxEvents: 10,
      initialSnapshot: snapshot,
    })

    expect(result.events).toBe(events)
    expect(events).toEqual([snapshot, click])
  })

  it('builds recording session and falls back to initial snapshot', () => {
    const initialSnapshot = { type: 2, timestamp: 10 } as any
    const session = buildRecordingSession([{ type: 3, timestamp: 20 } as any], initialSnapshot)

    expect(session?.events[0]).toBe(initialSnapshot)
    expect(session?.startTime).toBe(10)
    expect(session?.endTime).toBe(20)
  })

  it('formats session size and exposes a safe server mock', () => {
    const session: RecordingSession = {
      events: [{ type: 2, timestamp: 1 } as any],
      startTime: 1,
      endTime: 1,
    }

    expect(getSessionSizeFormatted(session)).toMatch(/B|KB|MB/)

    const serverMock = createServerSessionRecorderMock()
    expect(serverMock.isActive()).toBe(false)
    expect(serverMock.getCurrentSession()).toBeNull()
  })
})
