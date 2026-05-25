import { AlertTriangle, Clock3, RefreshCcw, Sparkles } from 'lucide-react'
import { BusinessPanelStatCard } from '../../shared/BusinessPanelStatCard'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'
import type { ReviewCounts, ReviewTranslator } from './types'

interface ReviewStatsGridProps {
  counts: ReviewCounts
  tReviews: ReviewTranslator
}

export function ReviewStatsGrid({ counts, tReviews }: ReviewStatsGridProps) {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div id="tour-reviews-stats" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <BusinessPanelStatCard
        icon={<Clock3 className="w-5 h-5" />}
        title={tReviews('stats.pending')}
        value={counts.pending}
        iconColor={panelTheme.actionColor}
      />
      <BusinessPanelStatCard
        icon={<AlertTriangle className="w-5 h-5" />}
        title={tReviews('stats.rejected')}
        value={counts.rejected}
        iconColor={panelTheme.dangerColor}
      />
      <BusinessPanelStatCard
        icon={<RefreshCcw className="w-5 h-5" />}
        title={tReviews('stats.updates')}
        value={counts.updates}
        iconColor={panelTheme.brandColor}
      />
      <BusinessPanelStatCard
        icon={<Sparkles className="w-5 h-5" />}
        title={tReviews('stats.fresh')}
        value={counts.fresh}
        iconColor={panelTheme.successColor}
      />
    </div>
  )
}
