import type { LandingLanguageOption, LandingNavLink } from './types';

export const LANDING_NAV_LINKS: LandingNavLink[] = [
  { key: 'home', href: '/' },
];

export const LANDING_LANGUAGE_OPTIONS: LandingLanguageOption[] = [
  { value: 'es', label: 'Español', flag: '🇲🇽' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'pt', label: 'Português', flag: '🇧🇷' },
];
