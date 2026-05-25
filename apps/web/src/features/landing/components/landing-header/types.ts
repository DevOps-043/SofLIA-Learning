import type { SupportedLanguage } from '@/core/i18n/i18n';
import type { Theme } from '@/core/stores/themeStore';

export interface LandingNavLink {
  key: string;
  href: string;
}

export interface LandingLanguageOption {
  value: SupportedLanguage;
  label: string;
  flag: string;
}

export interface LandingHeaderState {
  isScrolled: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  isThemeDropdownOpen: boolean;
  setIsThemeDropdownOpen: (isOpen: boolean) => void;
  isLanguageDropdownOpen: boolean;
  setIsLanguageDropdownOpen: (isOpen: boolean) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

export type LandingHeaderTranslator = (key: string, fallback: string) => string;
