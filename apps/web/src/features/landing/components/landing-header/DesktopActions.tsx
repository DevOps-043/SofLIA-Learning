import Link from 'next/link';
import { LANDING_LANGUAGE_OPTIONS } from './constants';
import { LanguageSelector } from './LanguageSelector';
import { ThemeSelector } from './ThemeSelector';
import { warmClientAccess } from './prefetch-auth';
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
      {/*
        data-navigating is set via vanilla DOM in onClick so the loading state
        applies even before React hydrates (the onclick attr runs immediately on
        click, before any JS framework). CSS selector [data-navigating] picks it
        up without React needing to re-render.
      */}
      <Link
        href="/auth"
        prefetch
        onMouseEnter={warmClientAccess}
        onFocus={warmClientAccess}
        className="group relative inline-flex cursor-pointer items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-primary transition-all duration-150 hover:scale-[1.02] active:scale-95 hover:text-accent dark:text-white/80 [&[data-navigating]]:cursor-wait [&[data-navigating]]:opacity-60"
        onClick={(e) => {
          // Mark the link immediately (runs before React re-renders and before
          // the browser navigates), giving instant visual feedback on cold start.
          ;(e.currentTarget as HTMLElement).dataset.navigating = 'true'
        }}
      >
        {t('landing.nav.clientAccess', 'Acceso clientes')}
      </Link>
      <Link
        href="/contact"
        prefetch
        className="inline-block cursor-pointer rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.03] active:scale-95 hover:bg-primary/90"
      >
        {t('landing.nav.scheduleDemo', 'Agendar demo')}
      </Link>
    </div>
  );
}
