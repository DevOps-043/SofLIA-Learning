'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Languages, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../providers/I18nProvider'
import type { SupportedLanguage } from '../../i18n/i18n'

interface LanguageSelectorProps {
  className?: string
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { language, setLanguage } = useLanguage()
  const { t } = useTranslation('common')

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLanguageChange = useCallback((lang: SupportedLanguage) => {
    setLanguage(lang)
    setIsOpen(false)
  }, [setLanguage])

  const languageOptions: { value: SupportedLanguage; label: string; flag: string }[] = [
    { value: 'es', label: t('languages.es'), flag: '🇲🇽' },
    { value: 'en', label: t('languages.en'), flag: '🇺🇸' },
    { value: 'pt', label: t('languages.pt'), flag: '🇧🇷' },
  ]

  const currentLanguage = languageOptions.find(opt => opt.value === language)

  return (
    <div className={`relative ${className}`} ref={dropdownRef} style={{ zIndex: 1000 }}>
      {/* Botón del selector */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-text-secondary dark:text-text-secondary hover:text-primary dark:hover:text-primary transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={t('languageSelector.label', { language: currentLanguage?.label })}
      >
        <Languages className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium uppercase">
          {language}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay de fondo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{
                duration: 0.2,
                ease: "easeOut"
              }}
              className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg dark:shadow-none border-2 border-gray-200 dark:border-gray-700 z-[9999] overflow-hidden"
            >
              <div className="py-2">
                {languageOptions.map((option, index) => {
                  const isActive = language === option.value
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => handleLanguageChange(option.value)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 ${
                        isActive
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.05
                      }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg">{option.flag}</span>
                      <span className="flex-1 text-sm font-medium">{option.label}</span>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
