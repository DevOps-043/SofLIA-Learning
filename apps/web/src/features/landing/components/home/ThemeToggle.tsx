'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useThemeStore } from '@/core/stores/themeStore';
import styles from './SofliaHome.module.css';

/**
 * Light/dark switch for the public home. Renders a stable placeholder until
 * mounted so the persisted theme never causes a hydration mismatch.
 */
export function ThemeToggle() {
  const { t } = useTranslation('home');
  const { resolvedTheme, setTheme } = useThemeStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isDark = resolvedTheme === 'dark';
  const label = isDark ? t('nav.switchToLight') : t('nav.switchToDark');

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isMounted ? label : t('nav.toggleTheme')}
      title={isMounted ? label : undefined}
    >
      {isMounted && isDark ? (
        <Sun size={17} aria-hidden="true" />
      ) : (
        <Moon size={17} aria-hidden="true" />
      )}
    </button>
  );
}
