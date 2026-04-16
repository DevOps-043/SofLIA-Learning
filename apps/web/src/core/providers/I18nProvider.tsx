'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState, createContext, useContext } from 'react';
import { I18nextProvider } from 'react-i18next';

import { initI18n, SupportedLanguage, syncI18nResources } from '../i18n/i18n';

interface LanguageContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const STORAGE_KEY = 'app-language';

export function I18nProvider({ children }: { children: ReactNode }) {
  const i18nInstance = useMemo(() => {
    return initI18n();
  }, []);
  const [language, setLanguageState] = useState<SupportedLanguage>('es');

  useEffect(() => {
    syncI18nResources();
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    syncI18nResources();

    const savedLanguage = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
    const initialLang = savedLanguage || 'es';
    setLanguageState(initialLang);
    document.documentElement.lang = initialLang;
    // Only change language if different from current to avoid unnecessary reload cycles
    if (i18nInstance.language !== initialLang) {
      i18nInstance.changeLanguage(initialLang).catch(() => {});
    }
  }, [i18nInstance]);

  const changeLanguage = useCallback(
    (lang: SupportedLanguage) => {
      setLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, lang);
        document.documentElement.lang = lang;
      }
      i18nInstance.changeLanguage(lang).catch(() => {});
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
