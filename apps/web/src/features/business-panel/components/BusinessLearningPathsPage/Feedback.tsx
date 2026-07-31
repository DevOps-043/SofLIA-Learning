import type { BusinessLearningPathsLogic } from './types'
import { AlertTriangle } from 'lucide-react'
import styles from '@/app/[orgSlug]/business-panel/courses/ContentPanel.module.css'

// Renders only unrecoverable data-loading errors (e.g., API unavailable).
// Transient action feedback (assign, revoke) is handled by ToastNotification
// via logic.toast + logic.hideToast in the parent page component.
export function BusinessLearningPathsFeedback({ logic }: { logic: BusinessLearningPathsLogic }) {
  if (!logic.error) return null
  return (
    <div className={styles.errorBanner} role="alert">
      <AlertTriangle aria-hidden="true" />
      <span>{logic.error}</span>
    </div>
  )
}
