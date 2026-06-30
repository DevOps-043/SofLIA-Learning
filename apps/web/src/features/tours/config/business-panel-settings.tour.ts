import type { TourConfig } from '@/features/tours'

export const businessPanelSettingsTour: TourConfig = {
  id: 'business-panel-settings',
  autoStart: true,
  steps: [
    {
      target: '#tour-settings-hero',
      titleKey: 'tours.businessPanelSettings.hero.title',
      contentKey: 'tours.businessPanelSettings.hero.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-settings-tabs',
      titleKey: 'tours.businessPanelSettings.tabs.title',
      contentKey: 'tours.businessPanelSettings.tabs.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="soflia-floating-button"], [data-tour-id="soflia-side-panel"]',
      titleKey: 'tours.businessPanelSettings.soflia.title',
      contentKey: 'tours.businessPanelSettings.soflia.content',
      placement: 'left',
      disableBeacon: true,
      optional: true,
    },
  ],
}
