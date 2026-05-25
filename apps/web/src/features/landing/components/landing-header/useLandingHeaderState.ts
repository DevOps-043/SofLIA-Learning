import { useEffect, useState } from 'react';
import { useLanguage } from '@/core/providers/I18nProvider';
import { useThemeStore } from '@/core/stores/themeStore';
import type { LandingHeaderState } from './types';

export function useLandingHeaderState(): LandingHeaderState {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const { theme, setTheme, initializeTheme } = useThemeStore();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickedOutsideDropdowns =
        !target.closest('.theme-dropdown') && !target.closest('.language-dropdown');

      if (clickedOutsideDropdowns) {
        setIsThemeDropdownOpen(false);
        setIsLanguageDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return {
    isScrolled,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isThemeDropdownOpen,
    setIsThemeDropdownOpen,
    isLanguageDropdownOpen,
    setIsLanguageDropdownOpen,
    theme,
    setTheme,
    language,
    setLanguage,
  };
}
