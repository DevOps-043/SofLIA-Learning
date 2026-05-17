import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import type { ReviewCounts, ReviewTab, ReviewTranslator } from './types'

interface ReviewTabsProps {
  activeTab: ReviewTab
  counts: ReviewCounts
  tReviews: ReviewTranslator
  onTabChange: (tab: ReviewTab) => void
}

export function ReviewTabs({ activeTab, counts, tReviews, onTabChange }: ReviewTabsProps) {
  const panelTheme = useBusinessPanelTheme()
  const tabs = [
    { id: 'pending' as const, label: tReviews('tabs.pending'), count: counts.pending },
    { id: 'rejected' as const, label: tReviews('tabs.rejected'), count: counts.rejected },
  ]

  return (
    <div
      className="inline-flex p-1 rounded-[18px] border gap-1"
      style={{ backgroundColor: panelTheme.cardBg, borderColor: panelTheme.borderColor }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className="px-5 py-3 rounded-[14px] text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2"
            style={{
              backgroundColor: isActive ? panelTheme.actionColor : 'transparent',
              color: isActive ? panelTheme.onActionColor : panelTheme.textColor,
              border: `1px solid ${isActive ? `${panelTheme.actionColor}30` : 'transparent'}`,
              opacity: isActive ? 1 : 0.76,
            }}
          >
            <span>{tab.label}</span>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: isActive ? `${panelTheme.onActionColor}1A` : panelTheme.hoverBg,
                color: isActive ? panelTheme.onActionColor : panelTheme.mutedTextColor,
              }}
            >
              {tab.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
