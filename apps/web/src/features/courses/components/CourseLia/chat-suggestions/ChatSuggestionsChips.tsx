'use client'

import { useTranslation } from 'react-i18next'

import { ChatSuggestionsHeader } from './ChatSuggestionsHeader'
import { ChatSuggestionsList } from './ChatSuggestionsList'
import { useChatSuggestionsExpanded } from './useChatSuggestionsExpanded'
import type { ChatSuggestionsChipsProps } from './types'
import styles from '../CourseLiaPanel.module.css'

export function ChatSuggestionsChips({
  suggestions,
  isLoading,
  onSuggestionClick,
  forceCollapse,
}: ChatSuggestionsChipsProps) {
  const { t } = useTranslation('common')
  const { isExpanded, toggleExpanded } = useChatSuggestionsExpanded(forceCollapse)

  if (!isLoading && suggestions.length === 0) {
    return null
  }

  return (
    <div
      data-tour-id="course-learn--soflia-suggestions"
      role="region"
      aria-label={t('lia.lessonSuggestions.title')}
      className={styles.suggestions}
    >
      <ChatSuggestionsHeader
        isExpanded={isExpanded}
        isLoading={isLoading}
        onToggleExpanded={toggleExpanded}
      />
      <ChatSuggestionsList
        isExpanded={isExpanded}
        isLoading={isLoading}
        onSuggestionClick={onSuggestionClick}
        suggestions={suggestions}
      />
    </div>
  )
}
