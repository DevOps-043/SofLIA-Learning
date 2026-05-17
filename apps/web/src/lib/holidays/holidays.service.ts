import { HOLIDAYS_BY_COUNTRY } from './holidays.config';
import {
  cleanOldHolidayCache,
  clearHolidayCache,
  createHolidayCacheKey,
  getCachedHolidayDates,
  setCachedHolidayDates,
} from './holiday-cache';
import { formatHolidayDate, isSameCalendarDay } from './holiday-date-utils';
import { buildHolidayDateSet, findHolidayName } from './holiday-resolver';
import { normalizeCountryCode } from './country-normalization';
import type { CountryHolidays } from './holidays.config';

export class HolidayService {
  static normalizeCountryCode(countryInput: string | undefined | null): string {
    return normalizeCountryCode(countryInput);
  }

  static getHolidayDatesForYear(countryCode: string, year: number): Set<string> {
    const normalizedCountry = this.normalizeCountryCode(countryCode);
    const cacheKey = createHolidayCacheKey(normalizedCountry, year);
    const cached = getCachedHolidayDates(cacheKey);

    if (cached) {
      return cached;
    }

    const countryHolidays = HOLIDAYS_BY_COUNTRY[normalizedCountry];
    const holidaySet = countryHolidays ? buildHolidayDateSet(countryHolidays, year) : new Set<string>();

    if (!countryHolidays) {
      console.warn(`No hay festivos configurados para el pais: ${normalizedCountry}`);
    }

    setCachedHolidayDates(cacheKey, holidaySet);
    return holidaySet;
  }

  static isHoliday(date: Date, countryCode: string): boolean {
    const holidays = this.getHolidayDatesForYear(countryCode, date.getFullYear());
    return holidays.has(formatHolidayDate(date));
  }

  static getHolidaysInRange(
    startDate: Date,
    endDate: Date,
    countryCode: string
  ): Array<{ date: Date; name: string }> {
    const normalizedCountry = this.normalizeCountryCode(countryCode);
    const countryHolidays = HOLIDAYS_BY_COUNTRY[normalizedCountry];

    if (!countryHolidays) {
      return [];
    }

    const holidays: Array<{ date: Date; name: string }> = [];

    for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
      this.getHolidayDatesForYear(normalizedCountry, year).forEach((dateString) => {
        const holidayDate = new Date(`${dateString}T00:00:00`);

        if (holidayDate >= startDate && holidayDate <= endDate) {
          holidays.push({
            date: holidayDate,
            name: findHolidayName(holidayDate, countryHolidays) || 'Festivo',
          });
        }
      });
    }

    return holidays.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static getHolidayName(date: Date, countryCode: string): string | null {
    const normalizedCountry = this.normalizeCountryCode(countryCode);
    const countryHolidays = HOLIDAYS_BY_COUNTRY[normalizedCountry];
    return countryHolidays ? findHolidayName(date, countryHolidays) : null;
  }

  static clearCache(): void {
    clearHolidayCache();
  }

  static cleanOldCache(): void {
    cleanOldHolidayCache();
  }

  static isSameDay(date1: Date, date2: Date): boolean {
    return isSameCalendarDay(date1, date2);
  }

  static getCountryInfo(countryCode: string): CountryHolidays | null {
    const normalizedCountry = this.normalizeCountryCode(countryCode);
    return HOLIDAYS_BY_COUNTRY[normalizedCountry] || null;
  }

  static countHolidaysInRange(startDate: Date, endDate: Date, countryCode: string): number {
    return this.getHolidaysInRange(startDate, endDate, countryCode).length;
  }

  static getNextHoliday(fromDate: Date, countryCode: string): { date: Date; name: string } | null {
    const year = fromDate.getFullYear();
    const currentYearHolidays = this.getHolidaysInRange(fromDate, new Date(year, 11, 31), countryCode);

    if (currentYearHolidays.length > 0) {
      return currentYearHolidays[0];
    }

    const nextYearHolidays = this.getHolidaysInRange(
      new Date(year + 1, 0, 1),
      new Date(year + 1, 11, 31),
      countryCode
    );

    return nextYearHolidays.length > 0 ? nextYearHolidays[0] : null;
  }
}
