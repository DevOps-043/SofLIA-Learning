import { beforeEach, describe, expect, it } from 'vitest';
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

  it('normalizes Mexico variants', () => {
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

  it('normalizes Colombia, Argentina, Chile and Peru variants', () => {
    expect(HolidayService.normalizeCountryCode('colombia')).toBe('CO');
    expect(HolidayService.normalizeCountryCode('co')).toBe('CO');
    expect(HolidayService.normalizeCountryCode('argentina')).toBe('AR');
    expect(HolidayService.normalizeCountryCode('chile')).toBe('CL');
    expect(HolidayService.normalizeCountryCode('perú')).toBe('PE');
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
