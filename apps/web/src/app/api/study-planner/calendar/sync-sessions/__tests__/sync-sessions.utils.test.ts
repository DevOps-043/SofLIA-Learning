import { describe, expect, it } from 'vitest'
import {
  buildStudySessionDescription,
  formatDateTimeInTimezone,
  parseSyncSessionsRequest,
} from '../sync-sessions.utils'

describe('sync-sessions.utils', () => {
  it('deduplicates session ids in the request payload', () => {
    const result = parseSyncSessionsRequest({
      sessionIds: ['session-1', 'session-1', 'session-2'],
    })

    expect(result.error).toBeUndefined()
    expect(result.data?.sessionIds).toEqual(['session-1', 'session-2'])
  })

  it('formats multiline descriptions as HTML bullet lists', () => {
    const description = buildStudySessionDescription({
      id: 'session-1',
      user_id: 'user-1',
      title: 'Sesion',
      description: '1. Leccion uno\n2. Leccion dos',
      start_time: '2026-04-01T10:00:00.000Z',
      end_time: '2026-04-01T11:00:00.000Z',
      plan_id: 'plan-1',
      course_id: 'course-1',
    })

    expect(description).toContain('&bull; Leccion uno')
    expect(description).toContain('&bull; Leccion dos')
  })

  it('formats ISO values using the provided timezone', () => {
    const result = formatDateTimeInTimezone(
      new Date('2026-04-01T10:30:15.000Z'),
      'UTC',
    )

    expect(result).toBe('2026-04-01T10:30:15')
  })
})
