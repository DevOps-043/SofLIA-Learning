import { describe, it, expect, vi } from 'vitest';
import {
  buildCalendarEventsUrl,
  detectScheduleConflicts,
  validateProposedSchedule,
} from '../calendar-validation.service';
import type { ProposedScheduleSlot } from '../study-schedule.service';

describe('buildCalendarEventsUrl', () => {
  it('builds URL with userId param', () => {
    const url = buildCalendarEventsUrl({ userId: 'user-123', baseUrl: 'https://app.test' });
    expect(url).toContain('/api/study-planner/calendar/events');
    expect(url).toContain('userId=user-123');
  });

  it('uses origin when baseUrl is not provided', () => {
    const url = buildCalendarEventsUrl({ userId: 'u1', origin: 'https://origin.test' });
    expect(url).toContain('origin.test');
  });

  it('falls back to localhost when no baseUrl or origin', () => {
    const url = buildCalendarEventsUrl({ userId: 'u1', baseUrl: '' });
    expect(url).toContain('localhost:3000');
  });

  it('encodes special characters in userId', () => {
    const url = buildCalendarEventsUrl({ userId: 'user+email@test.com', baseUrl: 'https://app.test' });
    expect(url).toContain('userId=');
  });
});

describe('detectScheduleConflicts', () => {
  const makeSlot = (date: string, startTime: string, endTime: string): ProposedScheduleSlot => ({
    date,
    startTime,
    endTime,
  });

  it('returns no conflicts when no events', () => {
    const result = detectScheduleConflicts([], [makeSlot('2025-06-15', '09:00', '10:00')]);
    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });

  it('returns no conflicts when no proposed slots', () => {
    const events = [{ title: 'Meeting', start: '2025-06-15T09:00:00', end: '2025-06-15T10:00:00' }];
    const result = detectScheduleConflicts(events, []);
    expect(result.hasConflicts).toBe(false);
  });

  it('detects conflict when slot overlaps event start', () => {
    const events = [{ title: 'Meeting', start: '2025-06-15T09:30:00', end: '2025-06-15T10:30:00' }];
    const slot = makeSlot('2025-06-15', '09:00', '10:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts[0].event).toBe('Meeting');
  });

  it('detects conflict when slot is fully inside event', () => {
    const events = [{ title: 'Block', start: '2025-06-15T08:00:00', end: '2025-06-15T12:00:00' }];
    const slot = makeSlot('2025-06-15', '09:00', '10:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.hasConflicts).toBe(true);
  });

  it('detects conflict when slot fully encompasses event', () => {
    const events = [{ title: 'Short', start: '2025-06-15T09:15:00', end: '2025-06-15T09:45:00' }];
    const slot = makeSlot('2025-06-15', '09:00', '10:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.hasConflicts).toBe(true);
  });

  it('no conflict when slot is completely before event', () => {
    const events = [{ title: 'Afternoon', start: '2025-06-15T14:00:00', end: '2025-06-15T15:00:00' }];
    const slot = makeSlot('2025-06-15', '09:00', '10:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.hasConflicts).toBe(false);
  });

  it('no conflict when slot is completely after event', () => {
    const events = [{ title: 'Morning', start: '2025-06-15T08:00:00', end: '2025-06-15T09:00:00' }];
    const slot = makeSlot('2025-06-15', '10:00', '11:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.hasConflicts).toBe(false);
  });

  it('skips events without start/end', () => {
    const events = [{ title: 'Incomplete' }];
    const slot = makeSlot('2025-06-15', '09:00', '10:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.hasConflicts).toBe(false);
  });

  it('uses fallback title "Evento sin título" for untitled events', () => {
    const events = [{ start: '2025-06-15T09:30:00', end: '2025-06-15T10:30:00' }];
    const slot = makeSlot('2025-06-15', '09:00', '10:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.conflicts[0].event).toBe('Evento sin título');
  });

  it('supports startTime/endTime event format', () => {
    const events = [{ title: 'Alt format', startTime: '2025-06-15T09:30:00', endTime: '2025-06-15T10:30:00' }];
    const slot = makeSlot('2025-06-15', '09:00', '10:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.hasConflicts).toBe(true);
  });

  it('includes date in conflict result', () => {
    const events = [{ title: 'X', start: '2025-06-15T09:30:00', end: '2025-06-15T10:00:00' }];
    const slot = makeSlot('2025-06-15', '09:00', '10:00');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.conflicts[0].date).toBe('2025-06-15');
  });

  it('returns multiple conflicts for multiple overlapping events', () => {
    const events = [
      { title: 'A', start: '2025-06-15T09:30:00', end: '2025-06-15T09:45:00' },
      { title: 'B', start: '2025-06-15T09:50:00', end: '2025-06-15T10:05:00' },
    ];
    const slot = makeSlot('2025-06-15', '09:00', '10:30');
    const result = detectScheduleConflicts(events, [slot]);
    expect(result.conflicts.length).toBeGreaterThanOrEqual(2);
  });
});

describe('validateProposedSchedule', () => {
  it('returns no conflicts when fetch fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    const result = await validateProposedSchedule({
      userId: 'u1',
      proposedSlots: [{ date: '2025-06-15', startTime: '09:00', endTime: '10:00' }],
      fetchImpl: fetchMock,
    });
    expect(result.hasConflicts).toBe(false);
    expect(result.conflicts).toHaveLength(0);
  });

  it('returns no conflicts when API returns non-ok', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false });
    const result = await validateProposedSchedule({
      userId: 'u1',
      proposedSlots: [{ date: '2025-06-15', startTime: '09:00', endTime: '10:00' }],
      fetchImpl: fetchMock as any,
    });
    expect(result.hasConflicts).toBe(false);
  });

  it('returns conflicts when API returns overlapping events', async () => {
    const mockEvents = [{ title: 'Meeting', start: '2025-06-15T09:30:00', end: '2025-06-15T10:30:00' }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events: mockEvents }),
    });
    const result = await validateProposedSchedule({
      userId: 'u1',
      proposedSlots: [{ date: '2025-06-15', startTime: '09:00', endTime: '10:00' }],
      baseUrl: 'https://app.test',
      fetchImpl: fetchMock as any,
    });
    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts[0].event).toBe('Meeting');
  });

  it('handles empty events array from API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    });
    const result = await validateProposedSchedule({
      userId: 'u1',
      proposedSlots: [{ date: '2025-06-15', startTime: '09:00', endTime: '10:00' }],
      fetchImpl: fetchMock as any,
    });
    expect(result.hasConflicts).toBe(false);
  });

  it('handles missing events key in API response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const result = await validateProposedSchedule({
      userId: 'u1',
      proposedSlots: [{ date: '2025-06-15', startTime: '09:00', endTime: '10:00' }],
      fetchImpl: fetchMock as any,
    });
    expect(result.hasConflicts).toBe(false);
  });
});
