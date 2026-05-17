import { AnimatePresence, motion } from 'framer-motion';
import { Check, Globe } from 'lucide-react';
import type { SupportedLanguage } from '@/core/i18n/i18n';
import type { LandingLanguageOption } from './types';

interface LanguageSelectorProps {
  isOpen: boolean;
  language: SupportedLanguage;
  options: LandingLanguageOption[];
  onOpenChange: (isOpen: boolean) => void;
  onOtherDropdownClose: () => void;
  onLanguageChange: (language: SupportedLanguage) => void;
}

export function LanguageSelector({
  isOpen,
  language,
  options,
  onOpenChange,
  onOtherDropdownClose,
  onLanguageChange,
}: LanguageSelectorProps) {
  return (
    <div className="relative language-dropdown">
      <motion.button
        onClick={() => {
          onOpenChange(!isOpen);
          onOtherDropdownClose();
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="rounded-xl p-2.5 text-gray-500 transition-all hover:bg-gray-100 hover:text-primary dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Cambiar idioma"
      >
        <Globe size={20} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-carbon-800"
          >
            {options.map((option) => {
              const isSelected = language === option.value;

              return (
                <motion.button
                  key={option.value}
                  onClick={() => {
                    onLanguageChange(option.value);
                    onOpenChange(false);
                  }}
                  whileHover={{ x: 4 }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-all ${isSelected
                    ? 'bg-accent/10 text-accent'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/5'
                    }`}
                >
                  <span className="text-lg">{option.flag}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                  {isSelected && <Check size={16} className="ml-auto text-accent" />}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
