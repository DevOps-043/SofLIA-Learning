import { AnimatePresence, motion } from 'framer-motion'

import type { LessonSuggestionItem } from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types'

import styles from '../CourseLiaPanel.module.css'
import { ChatSuggestionChip } from './ChatSuggestionChip'
import { ChatSuggestionsSkeleton } from './ChatSuggestionsSkeleton'

interface ChatSuggestionsListProps {
  isExpanded: boolean
  isLoading: boolean
  onSuggestionClick: (suggestion: LessonSuggestionItem) => void
  suggestions: LessonSuggestionItem[]
}

export function ChatSuggestionsList({
  isExpanded,
  isLoading,
  onSuggestionClick,
  suggestions,
}: ChatSuggestionsListProps) {
  return (
    <AnimatePresence>
      {isExpanded ? (
        <motion.div
          initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
          animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
          exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          <div className={styles.suggestionsGrid}>
            {isLoading ? (
              <ChatSuggestionsSkeleton />
            ) : (
              <AnimatePresence initial={false}>
                {suggestions.map((suggestion) => (
                  <ChatSuggestionChip
                    key={suggestion.id}
                    onSuggestionClick={onSuggestionClick}
                    suggestion={suggestion}
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
