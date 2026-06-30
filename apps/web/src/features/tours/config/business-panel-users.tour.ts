import type { TourConfig } from '@/features/tours'

export const businessPanelUsersTour: TourConfig = {
  id: 'business-panel-users',
  autoStart: true,
  steps: [
    {
      target: '#tour-users-hero',
      titleKey: 'tours.businessPanelUsers.hero.title',
      contentKey: 'tours.businessPanelUsers.hero.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-users-stats',
      titleKey: 'tours.businessPanelUsers.stats.title',
      contentKey: 'tours.businessPanelUsers.stats.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-users-filters',
      titleKey: 'tours.businessPanelUsers.filters.title',
      contentKey: 'tours.businessPanelUsers.filters.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-users-list',
      titleKey: 'tours.businessPanelUsers.list.title',
      contentKey: 'tours.businessPanelUsers.list.content',
      placement: 'top',
      disableBeacon: true,
      optional: true,
    },
    {
      target: '#tour-users-actions',
      titleKey: 'tours.businessPanelUsers.actions.title',
      contentKey: 'tours.businessPanelUsers.actions.content',
      placement: 'bottom-end',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="soflia-floating-button"], [data-tour-id="soflia-side-panel"]',
      titleKey: 'tours.businessPanelUsers.soflia.title',
      contentKey: 'tours.businessPanelUsers.soflia.content',
      placement: 'left',
      disableBeacon: true,
      optional: true,
    },
  ],
}
