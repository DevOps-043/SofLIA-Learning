import type { TourConfig } from '@/features/tours'

export const businessUserDashboardTour: TourConfig = {
  id: 'business-user-dashboard',
  autoStart: true,
  steps: [
    { target: '[data-tour-id="business-user-dashboard--hero"]', titleKey: 'tours.businessUserDashboard.welcome.title', contentKey: 'tours.businessUserDashboard.welcome.content', placement: 'bottom', disableBeacon: true },
    { target: '[data-tour-id="business-user-dashboard--top-nav"]', titleKey: 'tours.businessUserDashboard.topNav.title', contentKey: 'tours.businessUserDashboard.topNav.content', placement: 'bottom', disableBeacon: true },
    { target: '[data-tour-id="business-user-dashboard--notifications"]', titleKey: 'tours.businessUserDashboard.notifications.title', contentKey: 'tours.businessUserDashboard.notifications.content', placement: 'bottom', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-user-dashboard--account-actions"]', titleKey: 'tours.businessUserDashboard.accountMenu.title', contentKey: 'tours.businessUserDashboard.accountMenu.content', placement: 'bottom-end', disableBeacon: true },
    { target: '[data-tour-id="business-user-dashboard--courses-header"]', titleKey: 'tours.businessUserDashboard.coursesHeader.title', contentKey: 'tours.businessUserDashboard.coursesHeader.content', placement: 'bottom', disableBeacon: true },
    { target: '[data-tour-id="business-user-dashboard--view-toggle"]', titleKey: 'tours.businessUserDashboard.viewToggle.title', contentKey: 'tours.businessUserDashboard.viewToggle.content', placement: 'left', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-user-dashboard--learning-path-title"]', titleKey: 'tours.businessUserDashboard.learningPath.title', contentKey: 'tours.businessUserDashboard.learningPath.content', placement: 'right', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-user-dashboard--intro-video"]', titleKey: 'tours.businessUserDashboard.introVideo.title', contentKey: 'tours.businessUserDashboard.introVideo.content', placement: 'left', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-user-dashboard--learning-path-next"]', titleKey: 'tours.businessUserDashboard.courseRail.title', contentKey: 'tours.businessUserDashboard.courseRail.content', placement: 'left', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-user-dashboard--course-card"]', titleKey: 'tours.businessUserDashboard.courseCard.title', contentKey: 'tours.businessUserDashboard.courseCard.content', placement: 'right', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-user-dashboard--certificate-action"]', titleKey: 'tours.businessUserDashboard.certificates.title', contentKey: 'tours.businessUserDashboard.certificates.content', placement: 'left', disableBeacon: true, optional: true },
    { target: '[data-tour-id="business-user-dashboard--standalone-section"]', titleKey: 'tours.businessUserDashboard.standalone.title', contentKey: 'tours.businessUserDashboard.standalone.content', placement: 'top', disableBeacon: true, optional: true },
    { target: '[data-tour-id="soflia-floating-button"], [data-tour-id="soflia-side-panel"]', titleKey: 'tours.businessUserDashboard.soflia.title', contentKey: 'tours.businessUserDashboard.soflia.content', placement: 'left', disableBeacon: true, optional: true },
  ],
}
