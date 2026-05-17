import { Inbox } from 'lucide-react'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import type { ReviewTab, ReviewTranslator } from './types'

interface ReviewEmptyStateProps {
  activeTab: ReviewTab
  tReviews: ReviewTranslator
}

export function ReviewEmptyState({ activeTab, tReviews }: ReviewEmptyStateProps) {
  const panelTheme = useBusinessPanelTheme()
  const titleKey = activeTab === 'pending' ? 'empty.pendingTitle' : 'empty.rejectedTitle'

  return (
    <div
      className="rounded-3xl border p-12 text-center"
      style={{ backgroundColor: panelTheme.cardBg, borderColor: panelTheme.borderColor }}
    >
      <div
        className="w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto mb-4"
        style={{ backgroundColor: panelTheme.hoverBg, borderColor: panelTheme.borderColor }}
      >
        <Inbox className="w-8 h-8" style={{ color: panelTheme.mutedTextColor }} />
      </div>
      <p className="text-lg font-semibold mb-2" style={{ color: panelTheme.textColor }}>
        {tReviews(titleKey)}
      </p>
      <p style={{ color: panelTheme.subtextColor }}>{tReviews('empty.description')}</p>
    </div>
  )
}
