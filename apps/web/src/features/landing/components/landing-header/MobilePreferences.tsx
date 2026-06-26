import { Globe, Moon, Sun } from 'lucide-react';
import { LANDING_LANGUAGE_OPTIONS } from './constants';
import type { LandingHeaderState } from './types';

interface MobilePreferencesProps {
  state: LandingHeaderState;
}

export function MobilePreferences({ state }: MobilePreferencesProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className="flex items-center gap-2">
        <Globe size={18} className="text-gray-500 dark:text-white/70" />
        <div className="flex gap-1">
          {LANDING_LANGUAGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => state.setLanguage(option.value)}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all hover:scale-[1.05] active:scale-[0.95] ${
                state.language === option.value
                  ? 'bg-accent/20 text-accent'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10'
              }`}
            >
              {option.flag}
            </button>
          ))}
        </div>
      </div>

      <div className="h-6 w-px bg-gray-200 dark:bg-white/10" />
      <div className="flex items-center gap-2">
        <MobileThemeButton active={state.theme === 'light'} onClick={() => state.setTheme('light')}>
          <Sun size={18} />
        </MobileThemeButton>
        <MobileThemeButton active={state.theme === 'dark'} onClick={() => state.setTheme('dark')}>
          <Moon size={18} />
        </MobileThemeButton>
      </div>
    </div>
  );
}

function MobileThemeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg p-2 transition-all hover:scale-[1.05] active:scale-[0.95] ${
        active
          ? 'bg-accent/20 text-accent'
          : 'text-gray-500 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10'
      }`}
    >
      {children}
    </button>
  );
}
