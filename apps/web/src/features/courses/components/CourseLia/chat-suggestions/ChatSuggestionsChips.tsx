'use client'

import { useTranslation } from 'react-i18next'

import { ChatSuggestionsHeader } from './ChatSuggestionsHeader'
import { ChatSuggestionsList } from './ChatSuggestionsList'
import { useChatSuggestionsExpanded } from './useChatSuggestionsExpanded'
import type { ChatSuggestionsChipsProps } from './types'

export function ChatSuggestionsChips({
  suggestions,
  isLoading,
  isLightTheme,
  theme,
  onSuggestionClick,
  forceCollapse,
}: ChatSuggestionsChipsProps) {
  const { t } = useTranslation('common')
  const { isExpanded, toggleExpanded } = useChatSuggestionsExpanded(forceCollapse)

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
      data-tour-id="course-learn--soflia-suggestions"
      role="region"
      aria-label={t('lia.lessonSuggestions.title')}
      style={{
        padding: '0 16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <ChatSuggestionsHeader
        isExpanded={isExpanded}
        isLoading={isLoading}
        onToggleExpanded={toggleExpanded}
        theme={theme}
      />
      <ChatSuggestionsList
        chipHoverBg={chipHoverBg}
        isExpanded={isExpanded}
        isLoading={isLoading}
        onSuggestionClick={onSuggestionClick}
        skeletonBg={skeletonBg}
        suggestions={suggestions}
        theme={theme}
      />
    </div>
  )
}
