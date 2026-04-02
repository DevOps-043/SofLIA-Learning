import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getGoogleCalendarEvents,
  getMicrosoftCalendarEvents,
} from '../calendar-events-provider.service'

const START = new Date('2026-04-01T00:00:00.000Z')
const END = new Date('2026-04-15T00:00:00.000Z')
const TOKEN = 'test-access-token'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeGoogleCalendarListResponse(
  calendars: Array<{ id: string; summary?: string; primary?: boolean }>,
) {
  return new Response(JSON.stringify({ items: calendars }), { status: 200 })
}

function makeGoogleEventsResponse(items: unknown[] = []) {
  return new Response(JSON.stringify({ items }), { status: 200 })
}

function makeMsEventsResponse(value: unknown[] = []) {
  return new Response(JSON.stringify({ value }), { status: 200 })
}

function makeGoogleEvent(id = 'g-event-1') {
  return {
    id,
    summary: 'Test Event',
    start: { dateTime: '2026-04-05T10:00:00Z' },
    end: { dateTime: '2026-04-05T11:00:00Z' },
  }
}

function makeMsEvent(id = 'ms-event-1') {
  return {
    id,
    subject: 'Test Event',
    isAllDay: false,
    start: { dateTime: '2026-04-05T10:00:00.0000000' },
    end: { dateTime: '2026-04-05T11:00:00.0000000' },
    location: { displayName: '' },
    showAs: 'busy',
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

// ─── getGoogleCalendarEvents ─────────────────────────────────────────────────

describe('getGoogleCalendarEvents', () => {
  it('returns events from primary calendar when no selectedCalendarIds', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        makeGoogleCalendarListResponse([{ id: 'primary', primary: true }]),
      )
      .mockResolvedValueOnce(makeGoogleEventsResponse([makeGoogleEvent()]))

    const events = await getGoogleCalendarEvents(TOKEN, START, END)

    expect(events).toHaveLength(1)
    expect(events[0]?.id).toBe('g-event-1')
  })

  it('returns empty array when calendarList fetch fails', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('Error', { status: 500 }))
      .mockResolvedValueOnce(makeGoogleEventsResponse([]))

    const events = await getGoogleCalendarEvents(TOKEN, START, END)

    expect(Array.isArray(events)).toBe(true)
  })

  it('throws SCOPE_INSUFFICIENT error when 403 with scope error', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('ACCESS_TOKEN_SCOPE_INSUFFICIENT', { status: 403 }),
    )

    await expect(getGoogleCalendarEvents(TOKEN, START, END)).rejects.toThrow(
      'SCOPE_INSUFFICIENT',
    )
  })

  it('filters calendars by selectedCalendarIds', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        makeGoogleCalendarListResponse([
          { id: 'cal-included', summary: 'Work' },
          { id: 'cal-excluded', summary: 'Personal' },
        ]),
      )
      .mockResolvedValueOnce(makeGoogleEventsResponse([makeGoogleEvent('included-event')]))

    const events = await getGoogleCalendarEvents(TOKEN, START, END, undefined, ['cal-included'])

    expect(events).toHaveLength(1)
    expect(events[0]?.id).toBe('included-event')
  })

  it('always includes SofLIA study sessions calendar', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        makeGoogleCalendarListResponse([
          { id: 'primary', primary: true },
          { id: 'soflia-cal', summary: 'soflia - sesiones de estudio' },
        ]),
      )
      .mockResolvedValueOnce(makeGoogleEventsResponse([]))
      .mockResolvedValueOnce(makeGoogleEventsResponse([makeGoogleEvent('soflia-event')]))

    const events = await getGoogleCalendarEvents(TOKEN, START, END, undefined, ['primary'])

    const ids = events.map((e) => e.id)
    expect(ids).toContain('soflia-event')
  })

  it('returns empty array when fetch throws', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    const events = await getGoogleCalendarEvents(TOKEN, START, END)
    expect(events).toEqual([])
  })
})

// ─── getMicrosoftCalendarEvents ───────────────────────────────────────────────

describe('getMicrosoftCalendarEvents', () => {
  it('returns events from default calendarView endpoint when no selectedCalendarIds', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      makeMsEventsResponse([makeMsEvent()]),
    )

    const events = await getMicrosoftCalendarEvents(TOKEN, START, END)

    expect(events).toHaveLength(1)
    expect(events[0]?.id).toBe('ms-event-1')
  })

  it('returns empty array when calendarView fetch fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response('Error', { status: 500 }),
    )

    const events = await getMicrosoftCalendarEvents(TOKEN, START, END)
    expect(events).toEqual([])
  })

  it('fetches each calendar separately when selectedCalendarIds are provided', async () => {
    const fetchMock = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(makeMsEventsResponse([makeMsEvent('ms-event-cal1')]))
      .mockResolvedValueOnce(makeMsEventsResponse([makeMsEvent('ms-event-cal2')]))

    const events = await getMicrosoftCalendarEvents(TOKEN, START, END, ['cal-1', 'cal-2'])

    expect(events).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('cal-1'),
      expect.any(Object),
    )
  })

  it('skips calendars that return non-ok status', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('Error', { status: 500 }))
      .mockResolvedValueOnce(makeMsEventsResponse([makeMsEvent()]))

    const events = await getMicrosoftCalendarEvents(TOKEN, START, END, ['cal-fail', 'cal-ok'])

    expect(events).toHaveLength(1)
  })

  it('returns empty array when fetch throws', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    const events = await getMicrosoftCalendarEvents(TOKEN, START, END)
    expect(events).toEqual([])
  })
})
