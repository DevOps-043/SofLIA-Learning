'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { LessonSuggestionItem } from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types'

interface ChatSuggestionsChipsTheme {
  accentColor: string
  borderColor: string
  inputBg: string
  textPrimary: string
  textSecondary: string
}

interface ChatSuggestionsChipsProps {
  suggestions: LessonSuggestionItem[]
  isLoading: boolean
  isLightTheme: boolean
  theme: ChatSuggestionsChipsTheme
  onSuggestionClick: (suggestion: LessonSuggestionItem) => void
}

const SKELETON_PLACEHOLDERS = 3
const ANIMATION_DURATION = 0.18

export function ChatSuggestionsChips(props: ChatSuggestionsChipsProps) {
  const { suggestions, isLoading, isLightTheme, theme, onSuggestionClick } =
    props
  const { t } = useTranslation('common')

  if (!isLoading && suggestions.length === 0) {
    return null
  }

  const skeletonBg = isLightTheme
    ? 'rgba(15, 23, 42, 0.06)'
    : 'rgba(255, 255, 255, 0.06)'
  const chipHoverBg = isLightTheme
    ? 'rgba(0, 212, 179, 0.08)'
    : 'rgba(0, 212, 179, 0.12)'

  return (
    <div
      role="region"
      aria-label={t('lia.lessonSuggestions.title')}
      style={{
        padding: '0 16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: theme.textSecondary,
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <Sparkles
          aria-hidden="true"
          style={{ width: '12px', height: '12px', color: theme.accentColor }}
        />
        <span>
          {isLoading
            ? t('lia.lessonSuggestions.loading')
            : t('lia.lessonSuggestions.title')}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
        }}
      >
        {isLoading
          ? Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, index) => (
              <div
                key={`skeleton-${String(index)}`}
                aria-hidden="true"
                style={{
                  height: '30px',
                  width: '40%',
                  minWidth: '120px',
                  borderRadius: '999px',
                  backgroundColor: skeletonBg,
                  border: `1px solid ${theme.borderColor}`,
                }}
              />
            ))
          : (
              <AnimatePresence initial={false}>
                {suggestions.map((suggestion) => (
                  <motion.button
                    key={suggestion.id}
                    type="button"
                    onClick={() => onSuggestionClick(suggestion)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92 }}
                    transition={{ duration: ANIMATION_DURATION }}
                    aria-label={suggestion.text}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      border: `1px solid ${theme.borderColor}`,
                      backgroundColor: theme.inputBg,
                      color: theme.textPrimary,
                      fontSize: '12px',
                      fontWeight: 500,
                      lineHeight: 1.3,
                      cursor: 'pointer',
                      maxWidth: '100%',
                      textAlign: 'left',
                      transition: 'background-color 160ms ease, border-color 160ms ease',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.backgroundColor = chipHoverBg
                      event.currentTarget.style.borderColor = theme.accentColor
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.backgroundColor = theme.inputBg
                      event.currentTarget.style.borderColor = theme.borderColor
                    }}
                    onFocus={(event) => {
                      event.currentTarget.style.borderColor = theme.accentColor
                    }}
                    onBlur={(event) => {
                      event.currentTarget.style.borderColor = theme.borderColor
                    }}
                  >
                    {suggestion.text}
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
      </div>
    </div>
  )
}
