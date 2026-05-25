import type { CountryHolidays } from '../holidays.types';

export const UNITED_STATES_HOLIDAYS: CountryHolidays = {
  countryCode: 'US',
  countryName: 'United States',
  timezone: 'America/New_York',
  holidays: [
    { name: "New Year's Day", type: 'fixed', date: '01-01', countryCode: 'US' },
    { name: 'Martin Luther King Jr. Day', type: 'fixed', date: '01-15', countryCode: 'US' },
    { name: "Presidents' Day", type: 'fixed', date: '02-19', countryCode: 'US' },
    { name: 'Memorial Day', type: 'fixed', date: '05-27', countryCode: 'US' },
    { name: 'Independence Day', type: 'fixed', date: '07-04', countryCode: 'US' },
    { name: 'Labor Day', type: 'fixed', date: '09-02', countryCode: 'US' },
    { name: 'Columbus Day', type: 'fixed', date: '10-14', countryCode: 'US', isOptional: true },
    { name: 'Veterans Day', type: 'fixed', date: '11-11', countryCode: 'US' },
    { name: 'Thanksgiving', type: 'fixed', date: '11-28', countryCode: 'US' },
    { name: 'Christmas Day', type: 'fixed', date: '12-25', countryCode: 'US' },
    { name: 'Christmas Eve', type: 'fixed', date: '12-24', countryCode: 'US', isOptional: true },
    { name: "New Year's Eve", type: 'fixed', date: '12-31', countryCode: 'US', isOptional: true },
  ],
  lastUpdated: new Date('2024-01-01'),
};
