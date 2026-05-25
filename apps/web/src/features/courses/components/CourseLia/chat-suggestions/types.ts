import type { LessonSuggestionItem } from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types'

export interface ChatSuggestionsChipsTheme {
  accentColor: string
  borderColor: string
  inputBg: string
  textPrimary: string
  textSecondary: string
}

export interface ChatSuggestionsChipsProps {
  suggestions: LessonSuggestionItem[]
  isLoading: boolean
  isLightTheme: boolean
  theme: ChatSuggestionsChipsTheme
  onSuggestionClick: (suggestion: LessonSuggestionItem) => void
  forceCollapse?: boolean | number
}

export interface ChatSuggestionsVisualProps {
  theme: ChatSuggestionsChipsTheme
}
