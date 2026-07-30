import { motion } from 'framer-motion'

import type { LessonSuggestionItem } from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types'

import styles from '../CourseLiaPanel.module.css'
import { ANIMATION_DURATION } from './constants'

interface ChatSuggestionChipProps {
  onSuggestionClick: (suggestion: LessonSuggestionItem) => void
  suggestion: LessonSuggestionItem
}

export function ChatSuggestionChip({
  onSuggestionClick,
  suggestion,
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
      className={styles.suggestionChip}
    >
      {suggestion.text}
    </motion.button>
  )
}
