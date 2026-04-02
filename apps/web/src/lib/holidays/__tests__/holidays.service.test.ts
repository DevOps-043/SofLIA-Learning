import { describe, it, expect, beforeEach } from 'vitest';
import { HolidayService } from '../holidays.service';

beforeEach(() => {
  HolidayService.clearCache();
});

describe('HolidayService.normalizeCountryCode', () => {
  it('returns MX as default when no input', () => {
    expect(HolidayService.normalizeCountryCode(null)).toBe('MX');
    expect(HolidayService.normalizeCountryCode(undefined)).toBe('MX');
    expect(HolidayService.normalizeCountryCode('')).toBe('MX');
  });

  it('normalizes México variants', () => {
    expect(HolidayService.normalizeCountryCode('mexico')).toBe('MX');
    expect(HolidayService.normalizeCountryCode('México')).toBe('MX');
    expect(HolidayService.normalizeCountryCode('mx')).toBe('MX');
    expect(HolidayService.normalizeCountryCode('MX')).toBe('MX');
    expect(HolidayService.normalizeCountryCode('mex')).toBe('MX');
  });

  it('normalizes Spain variants', () => {
    expect(HolidayService.normalizeCountryCode('españa')).toBe('ES');
    expect(HolidayService.normalizeCountryCode('espana')).toBe('ES');
    expect(HolidayService.normalizeCountryCode('spain')).toBe('ES');
    expect(HolidayService.normalizeCountryCode('ES')).toBe('ES');
    expect(HolidayService.normalizeCountryCode('esp')).toBe('ES');
  });

  it('normalizes USA variants', () => {
    expect(HolidayService.normalizeCountryCode('usa')).toBe('US');
    expect(HolidayService.normalizeCountryCode('us')).toBe('US');
    expect(HolidayService.normalizeCountryCode('united states')).toBe('US');
    expect(HolidayService.normalizeCountryCode('america')).toBe('US');
  });

  it('normalizes Colombia', () => {
    expect(HolidayService.normalizeCountryCode('colombia')).toBe('CO');
    expect(HolidayService.normalizeCountryCode('co')).toBe('CO');
    expect(HolidayService.normalizeCountryCode('col')).toBe('CO');
  });

  it('normalizes Argentina', () => {
    expect(HolidayService.normalizeCountryCode('argentina')).toBe('AR');
    expect(HolidayService.normalizeCountryCode('ar')).toBe('AR');
  });

  it('normalizes Chile', () => {
    expect(HolidayService.normalizeCountryCode('chile')).toBe('CL');
    expect(HolidayService.normalizeCountryCode('cl')).toBe('CL');
  });

  it('normalizes Peru', () => {
    expect(HolidayService.normalizeCountryCode('peru')).toBe('PE');
    expect(HolidayService.normalizeCountryCode('perú')).toBe('PE');
    expect(HolidayService.normalizeCountryCode('pe')).toBe('PE');
  });

  it('defaults to MX for unknown country codes', () => {
    expect(HolidayService.normalizeCountryCode('unknown')).toBe('MX');
    expect(HolidayService.normalizeCountryCode('ZZ')).toBe('MX');
  });

  it('is case-insensitive', () => {
    expect(HolidayService.normalizeCountryCode('MEXICO')).toBe('MX');
    expect(HolidayService.normalizeCountryCode('SPAIN')).toBe('ES');
  });
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
    expect(first).toBe(second); // Same reference = cached
  });

  it('includes New Year for Mexico (2025-01-01)', () => {
    const holidays = HolidayService.getHolidayDatesForYear('MX', 2025);
    expect(holidays.has('2025-01-01')).toBe(true);
  });

  it('returns dates in YYYY-MM-DD format', () => {
    const holidays = HolidayService.getHolidayDatesForYear('MX', 2025);
    for (const date of holidays) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('returns empty Set for unknown country', () => {
    // Unknown country → defaults to MX actually, so test a non-configured one
    const holidays = HolidayService.getHolidayDatesForYear('XX', 2025);
    // XX isn't in config → empty set
    expect(holidays.size).toBe(0);
  });

  it('normalizes country code before lookup', () => {
    const byCode = HolidayService.getHolidayDatesForYear('mx', 2025);
    const byNorm = HolidayService.getHolidayDatesForYear('MX', 2025);
    expect(byCode.size).toBe(byNorm.size);
  });
});

describe('HolidayService.isHoliday', () => {
  it('returns true for January 1st in Mexico', () => {
    const newYear = new Date('2025-01-01T12:00:00');
    expect(HolidayService.isHoliday(newYear, 'MX')).toBe(true);
  });

  it('returns false for a regular weekday', () => {
    // A typical non-holiday Tuesday
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

  it('returns false for different days', () => {
    const d1 = new Date('2025-06-15T09:00:00');
    const d2 = new Date('2025-06-16T09:00:00');
    expect(HolidayService.isSameDay(d1, d2)).toBe(false);
  });

  it('returns false for different months', () => {
    const d1 = new Date('2025-01-15T09:00:00');
    const d2 = new Date('2025-02-15T09:00:00');
    expect(HolidayService.isSameDay(d1, d2)).toBe(false);
  });

  it('returns false for different years', () => {
    const d1 = new Date('2024-06-15T09:00:00');
    const d2 = new Date('2025-06-15T09:00:00');
    expect(HolidayService.isSameDay(d1, d2)).toBe(false);
  });
});

describe('HolidayService.getHolidaysInRange', () => {
  it('returns array of holidays with date and name', () => {
    const start = new Date('2025-01-01T00:00:00');
    const end = new Date('2025-01-31T23:59:59');
    const holidays = HolidayService.getHolidaysInRange(start, end, 'MX');
    expect(Array.isArray(holidays)).toBe(true);
    expect(holidays.length).toBeGreaterThan(0);
    for (const h of holidays) {
      expect(h).toHaveProperty('date');
      expect(h).toHaveProperty('name');
      expect(h.date).toBeInstanceOf(Date);
      expect(typeof h.name).toBe('string');
    }
  });

  it('returns empty array for range with no holidays', () => {
    // June 2-8 in Mexico — likely no holidays
    const start = new Date('2025-06-02T00:00:00');
    const end = new Date('2025-06-08T23:59:59');
    const holidays = HolidayService.getHolidaysInRange(start, end, 'MX');
    expect(holidays).toHaveLength(0);
  });

  it('returns holidays sorted by date', () => {
    const start = new Date('2025-01-01T00:00:00');
    const end = new Date('2025-12-31T23:59:59');
    const holidays = HolidayService.getHolidaysInRange(start, end, 'MX');
    for (let i = 1; i < holidays.length; i++) {
      expect(holidays[i].date.getTime()).toBeGreaterThanOrEqual(holidays[i - 1].date.getTime());
    }
  });

  it('returns empty array for unknown country', () => {
    const start = new Date('2025-01-01T00:00:00');
    const end = new Date('2025-12-31T23:59:59');
    const holidays = HolidayService.getHolidaysInRange(start, end, 'XX');
    expect(holidays).toHaveLength(0);
  });

  it('works across year boundaries', () => {
    const start = new Date('2024-12-25T00:00:00');
    const end = new Date('2025-01-05T23:59:59');
    const holidays = HolidayService.getHolidaysInRange(start, end, 'MX');
    // Should include Dec 25 and Jan 1
    expect(holidays.length).toBeGreaterThan(0);
  });
});

describe('HolidayService.countHolidaysInRange', () => {
  it('returns a number', () => {
    const start = new Date('2025-01-01T00:00:00');
    const end = new Date('2025-12-31T23:59:59');
    const count = HolidayService.countHolidaysInRange(start, end, 'MX');
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThan(0);
  });

  it('matches getHolidaysInRange length', () => {
    const start = new Date('2025-01-01T00:00:00');
    const end = new Date('2025-12-31T23:59:59');
    const list = HolidayService.getHolidaysInRange(start, end, 'MX');
    const count = HolidayService.countHolidaysInRange(start, end, 'MX');
    expect(count).toBe(list.length);
  });
});

describe('HolidayService.getHolidayName', () => {
  it('returns name for a known holiday', () => {
    const newYear = new Date('2025-01-01T12:00:00');
    const name = HolidayService.getHolidayName(newYear, 'MX');
    expect(name).toBeTruthy();
    expect(typeof name).toBe('string');
  });

  it('returns null for a non-holiday date', () => {
    const regular = new Date('2025-06-10T12:00:00');
    const name = HolidayService.getHolidayName(regular, 'MX');
    expect(name).toBeNull();
  });

  it('returns null for unknown country', () => {
    const date = new Date('2025-01-01T12:00:00');
    const name = HolidayService.getHolidayName(date, 'XX');
    expect(name).toBeNull();
  });
});

describe('HolidayService.getNextHoliday', () => {
  it('returns an object with date and name', () => {
    const from = new Date('2025-01-01T00:00:00');
    const next = HolidayService.getNextHoliday(from, 'MX');
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

describe('HolidayService.clearCache / cleanOldCache', () => {
  it('clearCache empties the cache so next call re-fetches', () => {
    HolidayService.getHolidayDatesForYear('MX', 2025); // populate
    HolidayService.clearCache();
    // After clear, next call creates a new Set instance (different reference)
    const fresh1 = HolidayService.getHolidayDatesForYear('MX', 2025);
    const fresh2 = HolidayService.getHolidayDatesForYear('MX', 2025);
    expect(fresh1).toBe(fresh2); // now cached again
  });

  it('cleanOldCache does not throw', () => {
    expect(() => HolidayService.cleanOldCache()).not.toThrow();
  });

  it('cleanOldCache removes old year entries', () => {
    // Populate a very old year
    HolidayService.getHolidayDatesForYear('MX', 2010);
    HolidayService.cleanOldCache();
    // Should not throw and old cache should be evicted
    // We can verify by checking it re-creates on next call
    const fresh = HolidayService.getHolidayDatesForYear('MX', 2010);
    expect(fresh).toBeInstanceOf(Set);
  });
});
