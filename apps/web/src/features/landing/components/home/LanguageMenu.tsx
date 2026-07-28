'use client';

import { Check, ChevronDown, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/core/providers/I18nProvider';
import type { SupportedLanguage } from '@/core/i18n/i18n';
import styles from './SofliaHome.module.css';

const LANGUAGES: Array<{ code: SupportedLanguage; label: string }> = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
];

/** Custom language dropdown styled to match the home design system. */
export function LanguageMenu() {
  const { t } = useTranslation('home');
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const selectLanguage = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={styles.languageMenu}>
      <button
        type="button"
        className={styles.languageTrigger}
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t('nav.language')}
      >
        <Globe size={15} aria-hidden="true" />
        <span>{language.toUpperCase()}</span>
        <motion.span
          className={styles.languageChevron}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          aria-hidden="true"
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen ? (
          <motion.ul
            className={styles.languageList}
            role="listbox"
            aria-label={t('nav.language')}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            {LANGUAGES.map((item) => {
              const isActive = item.code === language;
              return (
                <li key={item.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    className={`${styles.languageOption} ${
                      isActive ? styles.languageOptionActive : ''
                    }`}
                    onClick={() => selectLanguage(item.code)}
                  >
                    <span className={styles.languageCode}>{item.code.toUpperCase()}</span>
                    {item.label}
                    {isActive ? <Check size={14} aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
