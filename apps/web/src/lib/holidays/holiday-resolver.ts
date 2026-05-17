import { formatHolidayDate } from './holiday-date-utils';
import type { CountryHolidays, Holiday } from './holidays.config';

export function resolveHolidayDate(holiday: Holiday, year: number): string | null {
  if (holiday.type === 'fixed' && holiday.date) {
    return `${year}-${holiday.date}`;
  }

  if (holiday.type !== 'variable' || !holiday.calculator) {
    return null;
  }

  try {
    return formatHolidayDate(holiday.calculator(year));
  } catch (error) {
    console.error(`Error calculando festivo variable "${holiday.name}" para ${year}:`, error);
    return null;
  }
}

export function buildHolidayDateSet(countryHolidays: CountryHolidays, year: number): Set<string> {
  const holidayDates = new Set<string>();

  countryHolidays.holidays.forEach((holiday) => {
    const date = resolveHolidayDate(holiday, year);

    if (date) {
      holidayDates.add(date);
    }
  });

  return holidayDates;
}

export function findHolidayName(date: Date, countryHolidays: CountryHolidays): string | null {
  const year = date.getFullYear();
  const dateString = formatHolidayDate(date);

  for (const holiday of countryHolidays.holidays) {
    if (resolveHolidayDate(holiday, year) === dateString) {
      return holiday.name;
    }
  }

  return null;
}
