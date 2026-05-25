import { beforeEach, describe, expect, it } from 'vitest';
import { HolidayService } from '../holidays.service';

beforeEach(() => {
  HolidayService.clearCache();
});

describe('HolidayService.getHolidayDatesForYear', () => {
  it('returns a Set for Mexico 2025', () => {
    const holidays = HolidayService.getHolidayDatesForYear('MX', 2025);
    expect(holidays).toBeInstanceOf(Set);
    expect(holidays.size).toBeGreaterThan(0);
  });

  it('returns cached result on second call', () => {
    const first = HolidayService.getHolidayDatesForYear('MX', 2025);
    const second = HolidayService.getHolidayDatesForYear('MX', 2025);
    expect(first).toBe(second);
  });

  it('includes New Year for Mexico', () => {
    const holidays = HolidayService.getHolidayDatesForYear('MX', 2025);
    expect(holidays.has('2025-01-01')).toBe(true);
  });

  it('returns dates in YYYY-MM-DD format', () => {
    const holidays = HolidayService.getHolidayDatesForYear('MX', 2025);

    for (const date of holidays) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('falls back to MX holidays for unknown country', () => {
    const mxHolidays = HolidayService.getHolidayDatesForYear('MX', 2025);
    const holidays = HolidayService.getHolidayDatesForYear('XX', 2025);
    expect(holidays).toEqual(mxHolidays);
  });
});

describe('HolidayService.isHoliday', () => {
  it('returns true for January 1st in Mexico', () => {
    const newYear = new Date('2025-01-01T12:00:00');
    expect(HolidayService.isHoliday(newYear, 'MX')).toBe(true);
  });

  it('returns false for a regular weekday', () => {
    const regular = new Date('2025-06-10T12:00:00');
    expect(HolidayService.isHoliday(regular, 'MX')).toBe(false);
  });

  it('accepts country string variants', () => {
    const newYear = new Date('2025-01-01T00:00:00');
    expect(HolidayService.isHoliday(newYear, 'mexico')).toBe(true);
    expect(HolidayService.isHoliday(newYear, 'mx')).toBe(true);
  });
});

describe('HolidayService.isSameDay', () => {
  it('returns true for same day', () => {
    const d1 = new Date('2025-06-15T09:00:00');
    const d2 = new Date('2025-06-15T23:59:59');
    expect(HolidayService.isSameDay(d1, d2)).toBe(true);
  });

  it('returns false for different calendar dates', () => {
    expect(HolidayService.isSameDay(new Date('2025-06-15'), new Date('2025-06-16'))).toBe(false);
    expect(HolidayService.isSameDay(new Date('2025-01-15'), new Date('2025-02-15'))).toBe(false);
    expect(HolidayService.isSameDay(new Date('2024-06-15'), new Date('2025-06-15'))).toBe(false);
  });
});
