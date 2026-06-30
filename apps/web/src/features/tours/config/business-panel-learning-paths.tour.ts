import type { TourConfig } from '@/features/tours'

export const businessPanelLearningPathsTour: TourConfig = {
  id: 'business-panel-learning-paths',
  autoStart: true,
  steps: [
    {
      target: '#tour-paths-hero',
      titleKey: 'tours.businessPanelLearningPaths.hero.title',
      contentKey: 'tours.businessPanelLearningPaths.hero.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-paths-stats',
      titleKey: 'tours.businessPanelLearningPaths.stats.title',
      contentKey: 'tours.businessPanelLearningPaths.stats.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-paths-search',
      titleKey: 'tours.businessPanelLearningPaths.search.title',
      contentKey: 'tours.businessPanelLearningPaths.search.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-paths-cards',
      titleKey: 'tours.businessPanelLearningPaths.cards.title',
      contentKey: 'tours.businessPanelLearningPaths.cards.content',
      placement: 'top',
      disableBeacon: true,
      optional: true,
    },
    {
      target: '#tour-paths-assignments',
      titleKey: 'tours.businessPanelLearningPaths.assignments.title',
      contentKey: 'tours.businessPanelLearningPaths.assignments.content',
      placement: 'top',
      disableBeacon: true,
      optional: true,
    },
    {
      target: '[data-tour-id="soflia-floating-button"], [data-tour-id="soflia-side-panel"]',
      titleKey: 'tours.businessPanelLearningPaths.soflia.title',
      contentKey: 'tours.businessPanelLearningPaths.soflia.content',
      placement: 'left',
      disableBeacon: true,
      optional: true,
    },
  ],
}
