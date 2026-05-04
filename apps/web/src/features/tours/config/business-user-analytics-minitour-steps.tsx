import React from 'react';
import type { Step } from 'react-joyride';
import { BarChart3, Brain, CalendarRange, Flame, LineChart, Sparkles, Trophy } from 'lucide-react';

import { getBusinessUserAnalyticsTourTargetSelector } from '../../../core/constants/tourTargets';
import type { MinitourTranslator } from './profile-minitour-steps';

export const BUSINESS_USER_ANALYTICS_MINITOUR_ID = 'business-user-analytics-minitour-v1';

const iconClassName = 'h-5 w-5 text-[var(--color-accent)]';

export function buildBusinessUserAnalyticsMinitourSteps(t: MinitourTranslator): Step[] {
  return [
    {
      target: getBusinessUserAnalyticsTourTargetSelector('header'),
      title: t('analyticsTour.steps.header.title'),
      content: t('analyticsTour.steps.header.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: { icon: <LineChart className={iconClassName} /> },
    },
    {
      target: getBusinessUserAnalyticsTourTargetSelector('rangeControls'),
      title: t('analyticsTour.steps.ranges.title'),
      content: t('analyticsTour.steps.ranges.content'),
      placement: 'bottom-end',
      disableBeacon: true,
      data: { icon: <CalendarRange className={iconClassName} /> },
    },
    {
      target: getBusinessUserAnalyticsTourTargetSelector('metrics'),
      title: t('analyticsTour.steps.metrics.title'),
      content: t('analyticsTour.steps.metrics.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: { icon: <Trophy className={iconClassName} /> },
    },
    {
      target: getBusinessUserAnalyticsTourTargetSelector('courseProgress'),
      title: t('analyticsTour.steps.courseProgress.title'),
      content: t('analyticsTour.steps.courseProgress.content'),
      placement: 'top',
      disableBeacon: true,
      data: { icon: <BarChart3 className={iconClassName} /> },
    },
    {
      target: getBusinessUserAnalyticsTourTargetSelector('aiAdoption'),
      title: t('analyticsTour.steps.aiAdoption.title'),
      content: t('analyticsTour.steps.aiAdoption.content'),
      placement: 'top',
      disableBeacon: true,
      data: { icon: <Brain className={iconClassName} /> },
    },
    {
      target: getBusinessUserAnalyticsTourTargetSelector('feedback'),
      title: t('analyticsTour.steps.feedback.title'),
      content: t('analyticsTour.steps.feedback.content'),
      placement: 'top',
      disableBeacon: true,
      data: { icon: <Sparkles className={iconClassName} /> },
    },
    {
      target: getBusinessUserAnalyticsTourTargetSelector('heatmap'),
      title: t('analyticsTour.steps.heatmap.title'),
      content: t('analyticsTour.steps.heatmap.content'),
      placement: 'top',
      disableBeacon: true,
      data: { icon: <Flame className={iconClassName} /> },
    },
  ];
}
