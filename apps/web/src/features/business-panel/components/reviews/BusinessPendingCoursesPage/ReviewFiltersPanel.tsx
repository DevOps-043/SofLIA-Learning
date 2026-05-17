import { BusinessPanelSearchInput } from '../../shared/BusinessPanelSearchInput'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import { ReviewTabs } from './ReviewTabs'
import type { ReviewCounts, ReviewTab, ReviewTranslator } from './types'

interface ReviewFiltersPanelProps {
  activeTab: ReviewTab
  counts: ReviewCounts
  searchTerm: string
  tReviews: ReviewTranslator
  onSearchChange: (value: string) => void
  onTabChange: (tab: ReviewTab) => void
}

export function ReviewFiltersPanel({
  activeTab,
  counts,
  searchTerm,
  tReviews,
  onSearchChange,
  onTabChange,
}: ReviewFiltersPanelProps) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div id="tour-reviews-filters" className="space-y-5">
      <ReviewTabs
        activeTab={activeTab}
        counts={counts}
        tReviews={tReviews}
        onTabChange={onTabChange}
      />
      <div
        className="rounded-3xl border p-4"
        style={{
          backgroundColor: panelTheme.cardBg,
          borderColor: panelTheme.borderColor,
        }}
      >
        <BusinessPanelSearchInput
          value={searchTerm}
          onChange={onSearchChange}
          placeholder={tReviews('searchPlaceholder')}
        />
      </div>
    </div>
  )
}
