import { AnimatePresence, motion } from 'framer-motion'

import type { LessonSuggestionItem } from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types'

import { ChatSuggestionChip } from './ChatSuggestionChip'
import { ChatSuggestionsSkeleton } from './ChatSuggestionsSkeleton'
import type { ChatSuggestionsVisualProps } from './types'

interface ChatSuggestionsListProps extends ChatSuggestionsVisualProps {
  chipHoverBg: string
  isExpanded: boolean
  isLoading: boolean
  onSuggestionClick: (suggestion: LessonSuggestionItem) => void
  skeletonBg: string
  suggestions: LessonSuggestionItem[]
}

export function ChatSuggestionsList({
  chipHoverBg,
  isExpanded,
  isLoading,
  onSuggestionClick,
  skeletonBg,
  suggestions,
  theme,
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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '4px' }}>
            {isLoading ? (
              <ChatSuggestionsSkeleton skeletonBg={skeletonBg} theme={theme} />
            ) : (
              <AnimatePresence initial={false}>
                {suggestions.map((suggestion) => (
                  <ChatSuggestionChip
                    key={suggestion.id}
                    chipHoverBg={chipHoverBg}
                    onSuggestionClick={onSuggestionClick}
                    suggestion={suggestion}
                    theme={theme}
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
