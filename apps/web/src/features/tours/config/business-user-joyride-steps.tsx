import React from 'react';
import type { Step } from 'react-joyride';
import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  Route,
  Sparkles,
  User,
} from 'lucide-react';

import {
  getBusinessUserDashboardTourTargetSelector,
  SHARED_TOUR_TARGET_IDS,
} from '../../../core/constants/tourTargets';

export const DASHBOARD_TOUR_ID = 'business-dashboard';

type BuildBusinessUserJoyrideStepsOptions = {
  isMobile: boolean;
  t?: (key: string) => string;
};

export function buildBusinessUserJoyrideSteps({
  isMobile,
  t = (key) => key,
}: BuildBusinessUserJoyrideStepsOptions): Step[] {
  return [
    {
      target: getBusinessUserDashboardTourTargetSelector('heroSection'),
      title: t('dashboardTour.steps.welcome.title'),
      content: t('dashboardTour.steps.welcome.content'),
      placement: 'center',
      disableBeacon: true,
      data: {
        icon: <Sparkles className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector('statsSection'),
      title: t('dashboardTour.steps.stats.title'),
      content: t('dashboardTour.steps.stats.content'),
      placement: isMobile ? 'top' : 'bottom',
      disableBeacon: true,
      data: {
        icon: <BarChart3 className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector('statCourses'),
      title: t('dashboardTour.steps.courses.title'),
      content: t('dashboardTour.steps.courses.content'),
      placement: isMobile ? 'bottom' : 'top',
      disableBeacon: true,
      data: {
        icon: <BookOpen className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector('statCertificates'),
      title: t('dashboardTour.steps.certificates.title'),
      content: t('dashboardTour.steps.certificates.content'),
      placement: isMobile ? 'bottom' : 'top',
      disableBeacon: true,
      data: {
        icon: <Award className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector(
        isMobile ? 'mobileMenuTrigger' : 'userDropdownTrigger',
      ),
      title: t('dashboardTour.steps.userMenu.title'),
      content: t('dashboardTour.steps.userMenu.content'),
      placement: isMobile ? 'bottom' : 'bottom-end',
      disableBeacon: true,
      data: {
        icon: <User className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: getBusinessUserDashboardTourTargetSelector('courseViewSwitcher'),
      title: t('dashboardTour.steps.courseViews.title'),
      content: t('dashboardTour.steps.courseViews.content'),
      placement: isMobile ? 'top' : 'left',
      disableBeacon: true,
      data: {
        icon: <Route className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
    {
      target: `#${SHARED_TOUR_TARGET_IDS.liaTrigger}`,
      title: t('dashboardTour.steps.soflia.title'),
      content: t('dashboardTour.steps.soflia.content'),
      placement: isMobile ? 'top' : 'top-end',
      disableBeacon: true,
      disableScrolling: true,
      spotlightPadding: isMobile ? 0 : 20,
      data: {
        icon: <Bot className="h-5 w-5 text-[#00D4B3]" />,
      },
    },
  ];
}

export const businessUserJoyrideSteps = buildBusinessUserJoyrideSteps({
  isMobile: false,
});
