import React from 'react';
import type { Step } from 'react-joyride';
import {
  BarChart3,
  BookOpen,
  Bot,
  Film,
  ListFilter,
  Menu,
  Route,
  Sparkles,
  User,
} from 'lucide-react';

import {
  getBusinessUserDashboardTourTargetSelector,
  SHARED_TOUR_TARGET_IDS,
} from '../../../core/constants/tourTargets';

export const DASHBOARD_TOUR_ID = 'business-dashboard';

export const BUSINESS_USER_TOUR_STEP_BEHAVIOR = {
  openUserMenu: 'open-user-menu',
  showLearningPaths: 'show-learning-paths',
} as const;

export type BusinessUserJoyrideTranslator = (key: string) => string;

type BuildBusinessUserJoyrideStepsOptions = {
  isMobile: boolean;
  hasCourseControls?: boolean;
  hasLearningPaths?: boolean;
  t?: BusinessUserJoyrideTranslator;
};

const tourIconClassName = 'h-5 w-5 text-[var(--color-accent)]';

export function buildBusinessUserJoyrideSteps({
  hasCourseControls = true,
  hasLearningPaths = true,
  isMobile,
  t = (key) => key,
}: BuildBusinessUserJoyrideStepsOptions): Step[] {
  const steps: Step[] = [
    {
      target: getBusinessUserDashboardTourTargetSelector('heroSection'),
      title: t('dashboardTour.steps.welcome.title'),
      content: t('dashboardTour.steps.welcome.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: {
        icon: <Sparkles className={tourIconClassName} />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector(
        isMobile ? 'mobileMenuTrigger' : 'userDropdownTrigger',
      ),
      title: t('dashboardTour.steps.userMenuTrigger.title'),
      content: t('dashboardTour.steps.userMenuTrigger.content'),
      placement: isMobile ? 'bottom' : 'bottom-end',
      disableBeacon: true,
      data: {
        icon: <User className={tourIconClassName} />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector(
        isMobile ? 'mobileMenuPanel' : 'userDropdownMenu',
      ),
      title: t('dashboardTour.steps.userMenuPanel.title'),
      content: t('dashboardTour.steps.userMenuPanel.content'),
      placement: isMobile ? 'bottom' : 'left',
      disableBeacon: true,
      data: {
        behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.openUserMenu,
        icon: <Menu className={tourIconClassName} />,
      },
    },
  ];

  if (hasCourseControls) {
    steps.push({
      target: getBusinessUserDashboardTourTargetSelector('courseViewSwitcher'),
      title: t('dashboardTour.steps.courseFilters.title'),
      content: t('dashboardTour.steps.courseFilters.content'),
      placement: isMobile ? 'top' : 'left',
      disableBeacon: true,
      data: {
        icon: <ListFilter className={tourIconClassName} />,
      },
    });
  }

  if (hasLearningPaths) {
    steps.push(
      {
        target: getBusinessUserDashboardTourTargetSelector('learningPathSection'),
        title: t('dashboardTour.steps.learningPaths.title'),
        content: t('dashboardTour.steps.learningPaths.content'),
        placement: isMobile ? 'top' : 'top',
        disableBeacon: true,
        data: {
          behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths,
          icon: <Route className={tourIconClassName} />,
        },
      },
      {
        target: getBusinessUserDashboardTourTargetSelector('learningPathIntroVideo'),
        title: t('dashboardTour.steps.learningPathVideo.title'),
        content: t('dashboardTour.steps.learningPathVideo.content'),
        placement: isMobile ? 'top' : 'left',
        disableBeacon: true,
        data: {
          behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths,
          icon: <Film className={tourIconClassName} />,
        },
      },
      {
        target: getBusinessUserDashboardTourTargetSelector('learningPathSection'),
        title: t('dashboardTour.steps.learningPathCourses.title'),
        content: t('dashboardTour.steps.learningPathCourses.content'),
        placement: isMobile ? 'top' : 'bottom',
        disableBeacon: true,
        data: {
          behavior: BUSINESS_USER_TOUR_STEP_BEHAVIOR.showLearningPaths,
          icon: <BookOpen className={tourIconClassName} />,
        },
      },
    );
  }

  steps.push(
    {
      target: `#${SHARED_TOUR_TARGET_IDS.liaTrigger}`,
      title: t('dashboardTour.steps.soflia.title'),
      content: t('dashboardTour.steps.soflia.content'),
      placement: isMobile ? 'top' : 'top-end',
      disableBeacon: true,
      disableScrolling: true,
      spotlightPadding: isMobile ? 4 : 10,
      styles: {
        spotlight: {
          borderRadius: '50%',
        },
      },
      data: {
        icon: <Bot className={tourIconClassName} />,
      },
    },
  );

  return steps;
}

export const businessUserJoyrideSteps = buildBusinessUserJoyrideSteps({
  isMobile: false,
});
