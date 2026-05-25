import { calculateGoodFriday, calculateHolyThursday } from '../easter-calculators';
import type { CountryHolidays } from '../holidays.types';

export const MEXICO_HOLIDAYS: CountryHolidays = {
  countryCode: 'MX',
  countryName: 'México',
  timezone: 'America/Mexico_City',
  holidays: [
    { name: 'Año Nuevo', type: 'fixed', date: '01-01', countryCode: 'MX' },
    { name: 'Día de la Constitución', type: 'fixed', date: '02-05', countryCode: 'MX' },
    { name: 'Natalicio de Benito Juárez', type: 'fixed', date: '03-21', countryCode: 'MX' },
    { name: 'Jueves Santo', type: 'variable', calculator: calculateHolyThursday, countryCode: 'MX' },
    { name: 'Viernes Santo', type: 'variable', calculator: calculateGoodFriday, countryCode: 'MX' },
    { name: 'Día del Trabajo', type: 'fixed', date: '05-01', countryCode: 'MX' },
    { name: 'Día de la Independencia', type: 'fixed', date: '09-16', countryCode: 'MX' },
    { name: 'Día de la Revolución', type: 'fixed', date: '11-20', countryCode: 'MX' },
    { name: 'Navidad', type: 'fixed', date: '12-25', countryCode: 'MX' },
    { name: 'Nochebuena', type: 'fixed', date: '12-24', countryCode: 'MX', isOptional: true },
    { name: 'Fin de Año', type: 'fixed', date: '12-31', countryCode: 'MX', isOptional: true },
  ],
  lastUpdated: new Date('2024-01-01'),
};
