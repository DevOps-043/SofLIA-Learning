import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, Globe2 } from 'lucide-react'

import { cn } from '@/shared/utils/cn'
import { MenuItem } from './MenuItem'
import styles from './UserDropdown.module.css'

const LANGUAGE_OPTIONS = [
  { value: 'es' as const, code: 'ES' },
  { value: 'en' as const, code: 'EN' },
  { value: 'pt' as const, code: 'PT' },
]

interface LanguageSubmenuProps {
  activeSubmenu: string | null
  accentColor: string
  isMounted: boolean
  language: 'es' | 'en' | 'pt'
  setActiveSubmenu: (submenu: string | null) => void
  setLanguage: (language: 'es' | 'en' | 'pt') => void
  t: (key: string) => string
}

export function LanguageSubmenu({
  activeSubmenu,
  accentColor,
  isMounted,
  language,
  setActiveSubmenu,
  setLanguage,
  t,
}: LanguageSubmenuProps) {
  const isOpen = activeSubmenu === 'language'

  return (
    <div>
      <MenuItem
        icon={Globe2}
        label={isMounted ? t('menu.languages.title') : '...'}
        rightElement={(
          <div className={styles.languageMeta}>
            <span>{language.toUpperCase()}</span>
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5',
                styles.languageChevron,
                isOpen && styles.languageChevronOpen,
              )}
            />
          </div>
        )}
        onClick={() => setActiveSubmenu(isOpen ? null : 'language')}
      />
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className={styles.submenu}>
              {LANGUAGE_OPTIONS.map((option) => {
                const isActive = language === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setLanguage(option.value)
                      setActiveSubmenu(null)
                    }}
                    className={cn(styles.submenuOption, isActive && styles.submenuActive)}
                  >
                    <span>{option.code}</span>
                    <span>{isMounted ? t(`menu.languages.${option.value}`) : '...'}</span>
                    {isActive && (
                      <Check
                        className={styles.submenuCheck}
                        style={{ color: accentColor }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
