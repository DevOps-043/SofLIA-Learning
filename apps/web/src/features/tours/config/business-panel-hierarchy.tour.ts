import type { TourConfig } from '@/features/tours'

export const businessPanelHierarchyTour: TourConfig = {
  id: 'business-panel-hierarchy',
  autoStart: true,
  steps: [
    {
      target: '[data-tour-id="business-panel-hierarchy--header"]',
      titleKey: 'tours.businessPanelHierarchy.header.title',
      contentKey: 'tours.businessPanelHierarchy.header.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="business-panel-hierarchy--tabs"]',
      titleKey: 'tours.businessPanelHierarchy.tabs.title',
      contentKey: 'tours.businessPanelHierarchy.tabs.content',
      placement: 'bottom-end',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="business-panel-hierarchy--structure-selector"]',
      titleKey: 'tours.businessPanelHierarchy.structureSelector.title',
      contentKey: 'tours.businessPanelHierarchy.structureSelector.content',
      placement: 'bottom-start',
      disableBeacon: true,
      optional: true,
    },
    {
      target: '[data-tour-id="business-panel-hierarchy--actions"]',
      titleKey: 'tours.businessPanelHierarchy.actions.title',
      contentKey: 'tours.businessPanelHierarchy.actions.content',
      placement: 'bottom-end',
      disableBeacon: true,
      optional: true,
    },
    {
      target: '[data-tour-id="business-panel-hierarchy--tree-body"]',
      titleKey: 'tours.businessPanelHierarchy.treeBody.title',
      contentKey: 'tours.businessPanelHierarchy.treeBody.content',
      placement: 'top',
      disableBeacon: true,
      optional: true,
    },
    {
      target: '[data-tour-id="soflia-floating-button"], [data-tour-id="soflia-side-panel"]',
      titleKey: 'tours.businessPanelHierarchy.soflia.title',
      contentKey: 'tours.businessPanelHierarchy.soflia.content',
      placement: 'left',
      disableBeacon: true,
      optional: true,
    },
  ],
}
