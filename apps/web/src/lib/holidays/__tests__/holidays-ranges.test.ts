import { beforeEach, describe, expect, it } from 'vitest';
import { HolidayService } from '../holidays.service';

beforeEach(() => {
  HolidayService.clearCache();
});

describe('HolidayService.getHolidaysInRange', () => {
  it('returns array of holidays with date and name', () => {
    const holidays = HolidayService.getHolidaysInRange(
      new Date('2025-01-01T00:00:00'),
      new Date('2025-01-31T23:59:59'),
      'MX'
    );

    expect(Array.isArray(holidays)).toBe(true);
    expect(holidays.length).toBeGreaterThan(0);

    for (const holiday of holidays) {
      expect(holiday).toHaveProperty('date');
      expect(holiday).toHaveProperty('name');
      expect(holiday.date).toBeInstanceOf(Date);
      expect(typeof holiday.name).toBe('string');
    }
  });

  it('returns empty array for range with no holidays', () => {
    const holidays = HolidayService.getHolidaysInRange(
      new Date('2025-06-02T00:00:00'),
      new Date('2025-06-08T23:59:59'),
      'MX'
    );
    expect(holidays).toHaveLength(0);
  });

  it('returns holidays sorted by date', () => {
    const holidays = HolidayService.getHolidaysInRange(
      new Date('2025-01-01T00:00:00'),
      new Date('2025-12-31T23:59:59'),
      'MX'
    );

    for (let index = 1; index < holidays.length; index++) {
      expect(holidays[index].date.getTime()).toBeGreaterThanOrEqual(holidays[index - 1].date.getTime());
    }
  });

  it('falls back to MX holiday ranges for unknown country', () => {
    const start = new Date('2025-01-01T00:00:00');
    const end = new Date('2025-12-31T23:59:59');
    const mxHolidays = HolidayService.getHolidaysInRange(start, end, 'MX');
    const holidays = HolidayService.getHolidaysInRange(start, end, 'XX');
    expect(holidays).toEqual(mxHolidays);
  });

  it('works across year boundaries', () => {
    const holidays = HolidayService.getHolidaysInRange(
      new Date('2024-12-25T00:00:00'),
      new Date('2025-01-05T23:59:59'),
      'MX'
    );
    expect(holidays.length).toBeGreaterThan(0);
  });
});

describe('HolidayService.countHolidaysInRange', () => {
  it('matches getHolidaysInRange length', () => {
    const start = new Date('2025-01-01T00:00:00');
    const end = new Date('2025-12-31T23:59:59');
    const list = HolidayService.getHolidaysInRange(start, end, 'MX');
    const count = HolidayService.countHolidaysInRange(start, end, 'MX');

    expect(typeof count).toBe('number');
    expect(count).toBe(list.length);
  });
});
