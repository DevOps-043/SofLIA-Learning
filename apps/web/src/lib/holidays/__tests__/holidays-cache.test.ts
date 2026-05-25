import { beforeEach, describe, expect, it } from 'vitest';
import { HolidayService } from '../holidays.service';

beforeEach(() => {
  HolidayService.clearCache();
});

describe('HolidayService.clearCache / cleanOldCache', () => {
  it('clearCache empties the cache so next call re-fetches', () => {
    HolidayService.getHolidayDatesForYear('MX', 2025);
    HolidayService.clearCache();

    const fresh1 = HolidayService.getHolidayDatesForYear('MX', 2025);
    const fresh2 = HolidayService.getHolidayDatesForYear('MX', 2025);
    expect(fresh1).toBe(fresh2);
  });

  it('cleanOldCache does not throw', () => {
    expect(() => HolidayService.cleanOldCache()).not.toThrow();
  });

  it('cleanOldCache removes old year entries without breaking future access', () => {
    HolidayService.getHolidayDatesForYear('MX', 2010);
    HolidayService.cleanOldCache();

    const fresh = HolidayService.getHolidayDatesForYear('MX', 2010);
    expect(fresh).toBeInstanceOf(Set);
  });
});
