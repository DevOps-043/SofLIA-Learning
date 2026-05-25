import { calculateGoodFriday, calculateHolyThursday } from '../easter-calculators';
import type { CountryHolidays } from '../holidays.types';

export const COLOMBIA_HOLIDAYS: CountryHolidays = {
  countryCode: 'CO',
  countryName: 'Colombia',
  timezone: 'America/Bogota',
  holidays: [
    { name: 'Año Nuevo', type: 'fixed', date: '01-01', countryCode: 'CO' },
    { name: 'Día de Reyes', type: 'fixed', date: '01-06', countryCode: 'CO', observedOnWeekend: 'substitute' },
    { name: 'Jueves Santo', type: 'variable', calculator: calculateHolyThursday, countryCode: 'CO' },
    { name: 'Viernes Santo', type: 'variable', calculator: calculateGoodFriday, countryCode: 'CO' },
    { name: 'Día del Trabajo', type: 'fixed', date: '05-01', countryCode: 'CO' },
    { name: 'Día de la Independencia', type: 'fixed', date: '07-20', countryCode: 'CO' },
    { name: 'Batalla de Boyacá', type: 'fixed', date: '08-07', countryCode: 'CO' },
    { name: 'Inmaculada Concepción', type: 'fixed', date: '12-08', countryCode: 'CO' },
    { name: 'Navidad', type: 'fixed', date: '12-25', countryCode: 'CO' },
    { name: 'Nochebuena', type: 'fixed', date: '12-24', countryCode: 'CO', isOptional: true },
    { name: 'Fin de Año', type: 'fixed', date: '12-31', countryCode: 'CO', isOptional: true },
  ],
  lastUpdated: new Date('2024-01-01'),
};
