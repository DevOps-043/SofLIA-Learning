import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, Globe } from 'lucide-react'
import { MenuItem } from './MenuItem'

const LANGUAGE_OPTIONS = [
  { value: 'es' as const, flag: '🇲🇽' },
  { value: 'en' as const, flag: '🇺🇸' },
  { value: 'pt' as const, flag: '🇧🇷' },
]

interface LanguageSubmenuProps {
  activeSubmenu: string | null
  isMounted: boolean
  language: 'es' | 'en' | 'pt'
  setActiveSubmenu: (submenu: string | null) => void
  setLanguage: (language: 'es' | 'en' | 'pt') => void
  t: (key: string) => string
}

export function LanguageSubmenu({
  activeSubmenu,
  isMounted,
  language,
  setActiveSubmenu,
  setLanguage,
  t,
}: LanguageSubmenuProps) {
  return (
    <div className="relative">
      <MenuItem
        icon={Globe}
        label={isMounted ? t('menu.languages.title') : '...'}
        rightElement={<div className="flex items-center gap-1"><span className="text-xs text-[var(--color-legacy-8b95a5)]">{language.toUpperCase()}</span><ChevronRight className={`w-3.5 h-3.5 text-[var(--color-legacy-8b95a5)] transition-transform ${activeSubmenu === 'language' ? 'rotate-90' : ''}`} /></div>}
        onClick={() => setActiveSubmenu(activeSubmenu === 'language' ? null : 'language')}
      />
      <AnimatePresence>
        {activeSubmenu === 'language' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="py-1 px-3 space-y-0.5">
              {LANGUAGE_OPTIONS.map((option) => {
                const isActive = language === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => { setLanguage(option.value); setActiveSubmenu(null) }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all ${isActive ? 'bg-accent/15 text-accent' : 'text-[var(--color-legacy-8b95a5)] hover:bg-white/5 hover:text-white'}`}
                  >
                    <span className="flex items-center gap-2"><span>{option.flag}</span><span>{isMounted ? t(`menu.languages.${option.value}`) : '...'}</span></span>
                    {isActive && <Check className="w-3 h-3 ml-auto" />}
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
