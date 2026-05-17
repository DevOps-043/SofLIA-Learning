import { beforeEach, describe, expect, it } from 'vitest';
import { HolidayService } from '../holidays.service';

beforeEach(() => {
  HolidayService.clearCache();
});

describe('HolidayService.getHolidayName', () => {
  it('returns name for a known holiday', () => {
    const name = HolidayService.getHolidayName(new Date('2025-01-01T12:00:00'), 'MX');
    expect(name).toBeTruthy();
    expect(typeof name).toBe('string');
  });

  it('returns null for a non-holiday date', () => {
    const name = HolidayService.getHolidayName(new Date('2025-06-10T12:00:00'), 'MX');
    expect(name).toBeNull();
  });

  it('falls back to MX holiday names for unknown country', () => {
    const date = new Date('2025-01-01T12:00:00');
    const mxName = HolidayService.getHolidayName(date, 'MX');
    const name = HolidayService.getHolidayName(date, 'XX');
    expect(name).toBe(mxName);
  });
});

describe('HolidayService.getNextHoliday', () => {
  it('returns an object with date and name', () => {
    const next = HolidayService.getNextHoliday(new Date('2025-01-01T00:00:00'), 'MX');
    expect(next).not.toBeNull();
    expect(next).toHaveProperty('date');
    expect(next).toHaveProperty('name');
  });

  it('returned date is on or after fromDate', () => {
    const from = new Date('2025-06-15T00:00:00');
    const next = HolidayService.getNextHoliday(from, 'MX');

    if (next) {
      expect(next.date.getTime()).toBeGreaterThanOrEqual(from.getTime());
    }
  });
});
