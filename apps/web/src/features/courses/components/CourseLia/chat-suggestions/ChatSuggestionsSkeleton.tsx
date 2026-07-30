import { SKELETON_PLACEHOLDERS } from './constants'
import styles from '../CourseLiaPanel.module.css'

export function ChatSuggestionsSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_PLACEHOLDERS }).map((_, index) => (
        <div
          key={`skeleton-${String(index)}`}
          aria-hidden="true"
          className={styles.suggestionSkeleton}
        />
      ))}
    </>
  )
}
