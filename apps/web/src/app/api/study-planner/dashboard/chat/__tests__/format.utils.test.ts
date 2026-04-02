import { describe, it, expect, beforeEach } from 'vitest';
import {
  setCurrentTimezone,
  getCurrentTimezone,
  getTimezoneOffset,
  formatPreferredDays,
  formatDate,
  formatTime,
  translateStatus,
  formatDateTime,
} from '../format.utils';

describe('setCurrentTimezone / getCurrentTimezone', () => {
  beforeEach(() => {
    // Reset to default
    setCurrentTimezone('America/Mexico_City');
  });

  it('defaults to America/Mexico_City', () => {
    expect(getCurrentTimezone()).toBe('America/Mexico_City');
  });

  it('sets and gets a new timezone', () => {
    setCurrentTimezone('America/Bogota');
    expect(getCurrentTimezone()).toBe('America/Bogota');
  });

  it('falls back to Mexico_City when empty string is set', () => {
    setCurrentTimezone('');
    expect(getCurrentTimezone()).toBe('America/Mexico_City');
  });
});

describe('getTimezoneOffset', () => {
  it('returns -06:00 for Mexico City', () => {
    expect(getTimezoneOffset('America/Mexico_City')).toBe('-06:00');
  });

  it('returns -05:00 for Bogota', () => {
    expect(getTimezoneOffset('America/Bogota')).toBe('-05:00');
  });

  it('returns -05:00 for New York', () => {
    expect(getTimezoneOffset('America/New_York')).toBe('-05:00');
  });

  it('returns -08:00 for Los Angeles', () => {
    expect(getTimezoneOffset('America/Los_Angeles')).toBe('-08:00');
  });

  it('returns -03:00 for Sao Paulo', () => {
    expect(getTimezoneOffset('America/Sao_Paulo')).toBe('-03:00');
  });

  it('returns -03:00 for Buenos Aires', () => {
    expect(getTimezoneOffset('America/Buenos_Aires')).toBe('-03:00');
  });

  it('returns +01:00 for Madrid', () => {
    expect(getTimezoneOffset('Europe/Madrid')).toBe('+01:00');
  });

  it('returns +00:00 for UTC', () => {
    expect(getTimezoneOffset('UTC')).toBe('+00:00');
  });

  it('returns +00:00 for London', () => {
    expect(getTimezoneOffset('Europe/London')).toBe('+00:00');
  });

  it('defaults to -06:00 for unknown timezones', () => {
    expect(getTimezoneOffset('Unknown/Zone')).toBe('-06:00');
    expect(getTimezoneOffset('')).toBe('-06:00');
  });
});

describe('formatPreferredDays', () => {
  it('formats a single day', () => {
    expect(formatPreferredDays([1])).toBe('Lun');
    expect(formatPreferredDays([5])).toBe('Vie');
  });

  it('formats multiple days', () => {
    const result = formatPreferredDays([1, 3, 5]);
    expect(result).toBe('Lun, Mié, Vie');
  });

  it('formats all days of the week', () => {
    const result = formatPreferredDays([0, 1, 2, 3, 4, 5, 6]);
    expect(result).toBe('Dom, Lun, Mar, Mié, Jue, Vie, Sáb');
  });

  it('formats empty array as empty string', () => {
    expect(formatPreferredDays([])).toBe('');
  });

  it('formats Sunday (0)', () => {
    expect(formatPreferredDays([0])).toBe('Dom');
  });

  it('formats Saturday (6)', () => {
    expect(formatPreferredDays([6])).toBe('Sáb');
  });

  it('formats weekdays', () => {
    const result = formatPreferredDays([1, 2, 3, 4, 5]);
    expect(result).toBe('Lun, Mar, Mié, Jue, Vie');
  });
});

describe('formatDate', () => {
  it('returns a non-empty string for a valid date', () => {
    const date = new Date('2025-01-15T12:00:00Z');
    const result = formatDate(date, 'UTC');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the year in the formatted output', () => {
    const date = new Date('2025-06-15T12:00:00Z');
    const result = formatDate(date, 'UTC');
    expect(result).toContain('2025');
  });

  it('accepts optional timezone parameter', () => {
    const date = new Date('2025-01-15T12:00:00Z');
    const result1 = formatDate(date, 'America/Mexico_City');
    const result2 = formatDate(date, 'America/Bogota');
    expect(typeof result1).toBe('string');
    expect(typeof result2).toBe('string');
  });

  it('uses current timezone when none specified', () => {
    setCurrentTimezone('UTC');
    const date = new Date('2025-01-15T12:00:00Z');
    const result = formatDate(date);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('formatTime', () => {
  it('returns a non-empty string for a valid date', () => {
    const date = new Date('2025-01-15T14:30:00Z');
    const result = formatTime(date, 'UTC');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes hours and minutes', () => {
    const date = new Date('2025-01-15T14:30:00Z');
    const result = formatTime(date, 'UTC');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });
});

describe('translateStatus', () => {
  it('translates planned status', () => {
    expect(translateStatus('planned')).toBe('Planificada');
  });

  it('translates in_progress status', () => {
    expect(translateStatus('in_progress')).toBe('En progreso');
  });

  it('translates completed status', () => {
    expect(translateStatus('completed')).toBe('Completada');
  });

  it('translates missed status', () => {
    expect(translateStatus('missed')).toBe('Perdida');
  });

  it('translates rescheduled status', () => {
    expect(translateStatus('rescheduled')).toBe('Reprogramada');
  });

  it('returns the original status for unknown values', () => {
    expect(translateStatus('unknown_status')).toBe('unknown_status');
    expect(translateStatus('custom')).toBe('custom');
    expect(translateStatus('')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('returns a non-empty string combining date and time', () => {
    setCurrentTimezone('UTC');
    const date = new Date('2025-01-15T14:30:00Z');
    const result = formatDateTime(date);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains "a las" separator', () => {
    setCurrentTimezone('UTC');
    const date = new Date('2025-01-15T14:30:00Z');
    const result = formatDateTime(date);
    expect(result).toContain('a las');
  });

  it('combines formatDate and formatTime output', () => {
    setCurrentTimezone('UTC');
    const date = new Date('2025-01-15T14:30:00Z');
    const dateStr = formatDate(date);
    const timeStr = formatTime(date);
    const combined = formatDateTime(date);
    expect(combined).toContain(dateStr);
    expect(combined).toContain(timeStr);
  });
});
