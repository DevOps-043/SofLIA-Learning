import type { TourConfig } from '@/features/tours'

export const businessPanelReviewsTour: TourConfig = {
  id: 'business-panel-reviews',
  autoStart: true,
  steps: [
    {
      target: '#tour-reviews-header',
      titleKey: 'tours.businessPanelReviews.header.title',
      contentKey: 'tours.businessPanelReviews.header.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-reviews-stats',
      titleKey: 'tours.businessPanelReviews.stats.title',
      contentKey: 'tours.businessPanelReviews.stats.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-reviews-filters',
      titleKey: 'tours.businessPanelReviews.filters.title',
      contentKey: 'tours.businessPanelReviews.filters.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-reviews-grid',
      titleKey: 'tours.businessPanelReviews.grid.title',
      contentKey: 'tours.businessPanelReviews.grid.content',
      placement: 'top',
      disableBeacon: true,
      optional: true,
    },
    {
      target: '[data-tour-id="soflia-floating-button"], [data-tour-id="soflia-side-panel"]',
      titleKey: 'tours.businessPanelReviews.soflia.title',
      contentKey: 'tours.businessPanelReviews.soflia.content',
      placement: 'left',
      disableBeacon: true,
      optional: true,
    },
  ],
}
