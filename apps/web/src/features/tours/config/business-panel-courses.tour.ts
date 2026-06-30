import type { TourConfig } from '@/features/tours'

export const businessPanelCoursesTour: TourConfig = {
  id: 'business-panel-courses',
  autoStart: true,
  steps: [
    {
      target: '[data-tour-id="business-panel-courses--hero"]',
      titleKey: 'tours.businessPanelCourses.hero.title',
      contentKey: 'tours.businessPanelCourses.hero.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="business-panel-courses--stats"]',
      titleKey: 'tours.businessPanelCourses.stats.title',
      contentKey: 'tours.businessPanelCourses.stats.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="business-panel-courses--filters"]',
      titleKey: 'tours.businessPanelCourses.filters.title',
      contentKey: 'tours.businessPanelCourses.filters.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="business-panel-courses--view-toggle"]',
      titleKey: 'tours.businessPanelCourses.viewToggle.title',
      contentKey: 'tours.businessPanelCourses.viewToggle.content',
      placement: 'bottom-end',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="business-panel-courses--grid"]',
      titleKey: 'tours.businessPanelCourses.grid.title',
      contentKey: 'tours.businessPanelCourses.grid.content',
      placement: 'top',
      disableBeacon: true,
      optional: true,
    },
    {
      target: '[data-tour-id="business-panel-courses--first-card"]',
      titleKey: 'tours.businessPanelCourses.firstCard.title',
      contentKey: 'tours.businessPanelCourses.firstCard.content',
      placement: 'right',
      disableBeacon: true,
      optional: true,
    },
  ],
}

export const businessPanelCourseDetailTour: TourConfig = {
  id: 'business-panel-course-detail',
  autoStart: true,
  steps: [
    {
      target: '[data-tour-id="business-panel-course-detail--hero"]',
      titleKey: 'tours.businessPanelCourseDetail.hero.title',
      contentKey: 'tours.businessPanelCourseDetail.hero.content',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="business-panel-course-detail--tabs-container"]',
      titleKey: 'tours.businessPanelCourseDetail.tabsContainer.title',
      contentKey: 'tours.businessPanelCourseDetail.tabsContainer.content',
      placement: 'top',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="business-panel-course-detail--sidebar"]',
      titleKey: 'tours.businessPanelCourseDetail.sidebar.title',
      contentKey: 'tours.businessPanelCourseDetail.sidebar.content',
      placement: 'left',
      disableBeacon: true,
    },
    {
      target: '[data-tour-id="soflia-floating-button"], [data-tour-id="soflia-side-panel"]',
      titleKey: 'tours.businessPanelCourseDetail.soflia.title',
      contentKey: 'tours.businessPanelCourseDetail.soflia.content',
      placement: 'left',
      disableBeacon: true,
      optional: true,
    },
  ],
}
