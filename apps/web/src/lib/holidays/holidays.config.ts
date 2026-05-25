import {
  COLOMBIA_HOLIDAYS,
  MEXICO_HOLIDAYS,
  SPAIN_HOLIDAYS,
  UNITED_STATES_HOLIDAYS,
} from './countries'
import type { CountryHolidays } from './holidays.types'

export type { CountryHolidays, Holiday } from './holidays.types'

export const HOLIDAYS_BY_COUNTRY: Record<string, CountryHolidays> = {
  MX: MEXICO_HOLIDAYS,
  ES: SPAIN_HOLIDAYS,
  US: UNITED_STATES_HOLIDAYS,
  CO: COLOMBIA_HOLIDAYS,
}

export const SUPPORTED_COUNTRIES = Object.keys(HOLIDAYS_BY_COUNTRY)

export function getCountryHolidays(countryCode: string): CountryHolidays | null {
  return HOLIDAYS_BY_COUNTRY[countryCode.toUpperCase()] || null
}
