'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { I18nextProvider } from 'react-i18next';

import { initI18n, SupportedLanguage, loadLanguageAsync } from '../i18n/i18n';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'app-language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const i18nInstance = useMemo(() => initI18n(), []);
  const [language, setLanguageState] = useState<SupportedLanguage>('es');

  // On mount: read the stored language preference, load its bundle if needed (EN/PT
  // are lazy chunks), then apply it. Spanish is always available immediately.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedLanguage = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    const initialLang = savedLanguage || 'es';

    const applyLanguage = async () => {
      if (initialLang !== 'es') {
        await loadLanguageAsync(initialLang);
      }
      setLanguageState(initialLang);
      document.documentElement.lang = initialLang;
      if (i18nInstance.language !== initialLang) {
        await i18nInstance.changeLanguage(initialLang);
      }
    };

    applyLanguage().catch(() => {
      // If the language bundle fails to load, stay on Spanish (already bundled)
      setLanguageState('es');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = useCallback(
    (lang: SupportedLanguage) => {
      const doChange = async () => {
        if (lang !== 'es') {
          await loadLanguageAsync(lang);
        }
        setLanguageState(lang);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, lang);
          document.documentElement.lang = lang;
        }
        await i18nInstance.changeLanguage(lang);
      };
      doChange().catch(() => {});
    },
    [i18nInstance]
  );

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: changeLanguage,
    }),
    [language, changeLanguage]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within an I18nProvider');
  }
  return ctx;
}
