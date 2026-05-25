import { calculateGoodFriday } from '../easter-calculators';
import type { CountryHolidays } from '../holidays.types';

export const SPAIN_HOLIDAYS: CountryHolidays = {
  countryCode: 'ES',
  countryName: 'España',
  timezone: 'Europe/Madrid',
  holidays: [
    { name: 'Año Nuevo', type: 'fixed', date: '01-01', countryCode: 'ES' },
    { name: 'Día de Reyes', type: 'fixed', date: '01-06', countryCode: 'ES' },
    { name: 'Viernes Santo', type: 'variable', calculator: calculateGoodFriday, countryCode: 'ES' },
    { name: 'Día del Trabajo', type: 'fixed', date: '05-01', countryCode: 'ES' },
    { name: 'Asunción de la Virgen', type: 'fixed', date: '08-15', countryCode: 'ES' },
    { name: 'Día de la Hispanidad', type: 'fixed', date: '10-12', countryCode: 'ES' },
    { name: 'Todos los Santos', type: 'fixed', date: '11-01', countryCode: 'ES' },
    { name: 'Día de la Constitución', type: 'fixed', date: '12-06', countryCode: 'ES' },
    { name: 'Inmaculada Concepción', type: 'fixed', date: '12-08', countryCode: 'ES' },
    { name: 'Navidad', type: 'fixed', date: '12-25', countryCode: 'ES' },
    { name: 'Nochebuena', type: 'fixed', date: '12-24', countryCode: 'ES', isOptional: true },
    { name: 'Fin de Año', type: 'fixed', date: '12-31', countryCode: 'ES', isOptional: true },
  ],
  lastUpdated: new Date('2024-01-01'),
};
