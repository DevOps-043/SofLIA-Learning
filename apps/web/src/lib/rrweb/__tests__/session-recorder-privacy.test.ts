import { describe, expect, it } from 'vitest'

import {
  buildSessionRecorderPrivacyConfig,
  sanitizeRecordedUrl,
} from '../session-recorder-privacy'
import {
  SESSION_RECORDER_BLOCK_SELECTOR,
  SESSION_RECORDER_MASK_TEXT_SELECTOR,
} from '../session-recorder-filters'
import { buildSessionRecorderRecordOptions } from '../session-recorder.options'

describe('session-recorder privacy config', () => {
  it('uses explicit selectors to block opt-out areas and mask marked text', () => {
    const config = buildSessionRecorderPrivacyConfig()

    expect(config.blockSelector).toBe(SESSION_RECORDER_BLOCK_SELECTOR)
    expect(config.maskTextSelector).toBe(SESSION_RECORDER_MASK_TEXT_SELECTOR)
  })

  it('filters sensitive URL params', () => {
    expect(
      sanitizeRecordedUrl('/dashboard?token=secret&course=math#section-1')
    ).toBe('/dashboard?course=math#section-1')
    expect(
      sanitizeRecordedUrl('https://example.com/path?access_token=abc&view=list')
    ).toBe('https://example.com/path?view=list')
  })

  it('enables masking for sensitive input types without masking all inputs globally', () => {
    const options = buildSessionRecorderRecordOptions({
      getEvents: () => [],
      getInitialSnapshot: () => null,
      isDev: false,
      maxEvents: 5,
      setEvents: () => undefined,
      setInitialSnapshot: () => undefined,
    })

    expect(options.maskAllInputs).toBe(false)
    expect(options.maskInputOptions).toMatchObject({
      email: true,
      password: true,
      search: true,
      tel: true,
      text: true,
      textarea: true,
      url: true,
    })
    expect(typeof options.maskInputFn).toBe('function')
    expect(typeof options.maskTextFn).toBe('function')
  })

  it('keeps a rolling buffer while preserving the initial snapshot', () => {
    let events = [
      { type: 2, timestamp: 1 },
      { type: 3, timestamp: 2 },
    ] as Array<{ type: number; timestamp: number }>
    let initialSnapshot = events[0]

    const options = buildSessionRecorderRecordOptions({
      getEvents: () => events as never[],
      getInitialSnapshot: () => initialSnapshot as never,
      isDev: true,
      maxEvents: 2,
      setEvents: (nextEvents) => {
        events = nextEvents as typeof events
      },
      setInitialSnapshot: (nextSnapshot) => {
        initialSnapshot = nextSnapshot as typeof initialSnapshot
      },
    })

    options.emit({ type: 4, timestamp: 3 })

    expect(events).toEqual([
      { type: 2, timestamp: 1 },
      { type: 4, timestamp: 3 },
    ])
    expect(initialSnapshot).toEqual({ type: 2, timestamp: 1 })
  })
})
