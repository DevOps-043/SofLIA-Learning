import type { LessonSuggestionItem } from '@/app/api/lia/lesson-suggestions/lesson-suggestions.types'

export interface ChatSuggestionsChipsProps {
  suggestions: LessonSuggestionItem[]
  isLoading: boolean
  onSuggestionClick: (suggestion: LessonSuggestionItem) => void
  forceCollapse?: boolean | number
}
