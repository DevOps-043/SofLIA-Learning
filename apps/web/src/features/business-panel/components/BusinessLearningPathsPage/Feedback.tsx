import type { BusinessLearningPathsLogic } from './types'

// Renders only unrecoverable data-loading errors (e.g., API unavailable).
// Transient action feedback (assign, revoke) is handled by ToastNotification
// via logic.toast + logic.hideToast in the parent page component.
export function BusinessLearningPathsFeedback({ logic }: { logic: BusinessLearningPathsLogic }) {
  const { dangerColor } = logic.theme
  if (!logic.error) return null
  return (
    <div
      className="rounded-[1.5rem] border px-6 py-3.5 text-sm font-medium"
      style={{
        backgroundColor: `color-mix(in srgb, ${dangerColor} 7.1%, transparent)`,
        borderColor: `color-mix(in srgb, ${dangerColor} 15.7%, transparent)`,
        color: dangerColor,
      }}
    >
      {logic.error}
    </div>
  )
}
