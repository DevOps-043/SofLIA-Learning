import { motion } from 'framer-motion';
import Link from 'next/link';
import { LANDING_LANGUAGE_OPTIONS } from './constants';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSelector } from './ThemeSelector';
import type { LandingHeaderState, LandingHeaderTranslator } from './types';

interface DesktopActionsProps {
  state: LandingHeaderState;
  t: LandingHeaderTranslator;
}

export function DesktopActions({ state, t }: DesktopActionsProps) {
  return (
    <div className="hidden items-center gap-2 lg:flex">
      <LanguageSelector
        isOpen={state.isLanguageDropdownOpen}
        language={state.language}
        options={LANDING_LANGUAGE_OPTIONS}
        onOpenChange={state.setIsLanguageDropdownOpen}
        onOtherDropdownClose={() => state.setIsThemeDropdownOpen(false)}
        onLanguageChange={state.setLanguage}
      />
      <ThemeSelector
        isOpen={state.isThemeDropdownOpen}
        theme={state.theme}
        onOpenChange={state.setIsThemeDropdownOpen}
        onOtherDropdownClose={() => state.setIsLanguageDropdownOpen(false)}
        onThemeChange={state.setTheme}
      />
      <div className="mx-1 h-6 w-px bg-gray-200 dark:bg-white/10" />
      <Link href="/auth">
        <motion.span
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-block cursor-pointer px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:text-accent dark:text-white/80"
        >
          {t('landing.nav.clientAccess', 'Acceso clientes')}
        </motion.span>
      </Link>
      <Link href="/contact">
        <motion.span
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-block cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:bg-primary/90"
        >
          {t('landing.nav.scheduleDemo', 'Agendar demo')}
        </motion.span>
      </Link>
    </div>
  );
}
