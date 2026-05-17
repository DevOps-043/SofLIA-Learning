import { motion } from 'framer-motion'

import type { LessonSuggestionItem } from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types'

import { ANIMATION_DURATION } from './constants'
import type { ChatSuggestionsVisualProps } from './types'

interface ChatSuggestionChipProps extends ChatSuggestionsVisualProps {
  chipHoverBg: string
  onSuggestionClick: (suggestion: LessonSuggestionItem) => void
  suggestion: LessonSuggestionItem
}

export function ChatSuggestionChip({
  chipHoverBg,
  onSuggestionClick,
  suggestion,
  theme,
}: ChatSuggestionChipProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSuggestionClick(suggestion)}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: ANIMATION_DURATION }}
      aria-label={suggestion.text}
      style={{ display: 'inline-flex', alignItems: 'center', padding: '8px 14px', borderRadius: '999px', border: `1px solid ${theme.borderColor}`, backgroundColor: theme.inputBg, color: theme.textPrimary, fontSize: '12px', fontWeight: 500, lineHeight: 1.3, cursor: 'pointer', maxWidth: '100%', textAlign: 'left', transition: 'background-color 160ms ease, border-color 160ms ease' }}
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
  )
}
