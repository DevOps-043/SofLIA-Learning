import type { TourConfig } from '@/features/tours'

export const businessPanelDashboardTour: TourConfig = {
  id: 'business-panel-dashboard',
  autoStart: true,
  steps: [
    { target: '[data-tour-id="business-panel-dashboard--hero-summary"]', titleKey: 'tours.businessPanelDashboard.welcome.title', contentKey: 'tours.businessPanelDashboard.welcome.content', placement: 'bottom', disableBeacon: true },
    { target: '[data-tour-id="business-panel-dashboard--tour-trigger"]', titleKey: 'tours.businessPanelDashboard.relaunch.title', contentKey: 'tours.businessPanelDashboard.relaunch.content', placement: 'bottom-end', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-panel-dashboard--top-nav"]', titleKey: 'tours.businessPanelDashboard.topNav.title', contentKey: 'tours.businessPanelDashboard.topNav.content', placement: 'bottom', disableBeacon: true },
    { target: '[data-tour-id="business-panel-dashboard--notifications"]', titleKey: 'tours.businessPanelDashboard.notifications.title', contentKey: 'tours.businessPanelDashboard.notifications.content', placement: 'bottom-end', disableBeacon: true },
    { target: '[data-tour-id="business-panel-dashboard--account-menu"]', titleKey: 'tours.businessPanelDashboard.accountMenu.title', contentKey: 'tours.businessPanelDashboard.accountMenu.content', placement: 'bottom-end', disableBeacon: true },
    { target: '[data-tour-id="business-panel-dashboard--sidebar-nav"]', titleKey: 'tours.businessPanelDashboard.sidebar.title', contentKey: 'tours.businessPanelDashboard.sidebar.content', placement: 'right', disableBeacon: true },
    { target: '[data-tour-id="business-panel-dashboard--sidebar-collapse"]', titleKey: 'tours.businessPanelDashboard.sidebarCollapse.title', contentKey: 'tours.businessPanelDashboard.sidebarCollapse.content', placement: 'right', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-panel-dashboard--stats-header"]', titleKey: 'tours.businessPanelDashboard.stats.title', contentKey: 'tours.businessPanelDashboard.stats.content', placement: 'right', disableBeacon: true },
    { target: '[data-tour-id="business-panel-dashboard--quick-actions-header"]', titleKey: 'tours.businessPanelDashboard.quickActions.title', contentKey: 'tours.businessPanelDashboard.quickActions.content', placement: 'left', disableBeacon: true },
    { target: '[data-tour-id="business-panel-dashboard--recent-activity-header"]', titleKey: 'tours.businessPanelDashboard.recentActivity.title', contentKey: 'tours.businessPanelDashboard.recentActivity.content', placement: 'top', disableBeacon: true },
    { target: '[data-tour-id="soflia-floating-button"], [data-tour-id="soflia-side-panel"]', titleKey: 'tours.businessPanelDashboard.soflia.title', contentKey: 'tours.businessPanelDashboard.soflia.content', placement: 'left', disableBeacon: true, optional: true },
  ],
}
