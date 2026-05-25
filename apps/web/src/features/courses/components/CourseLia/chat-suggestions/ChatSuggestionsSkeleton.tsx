import { SKELETON_PLACEHOLDERS } from './constants'
import type { ChatSuggestionsVisualProps } from './types'

interface ChatSuggestionsSkeletonProps extends ChatSuggestionsVisualProps {
  skeletonBg: string
}

export function ChatSuggestionsSkeleton({
  skeletonBg,
  theme,
}: ChatSuggestionsSkeletonProps) {
  return (
    <>
      {Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, index) => (
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
      ))}
    </>
  )
}
