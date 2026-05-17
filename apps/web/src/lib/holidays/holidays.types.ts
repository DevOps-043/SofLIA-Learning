export interface Holiday {
  name: string;
  type: 'fixed' | 'variable';
  date?: string;
  calculator?: (year: number) => Date;
  countryCode: string;
  observedOnWeekend?: 'substitute' | 'skip' | 'same';
  isOptional?: boolean;
}

export interface CountryHolidays {
  countryCode: string;
  countryName: string;
  timezone?: string;
  holidays: Holiday[];
  lastUpdated: Date;
}
