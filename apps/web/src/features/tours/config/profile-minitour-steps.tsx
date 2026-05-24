import React from 'react';
import type { Step } from 'react-joyride';
import { BarChart3, Camera, Lock, SlidersHorizontal, User, UserRound } from 'lucide-react';

import { getProfileTourTargetSelector } from '../../../core/constants/tourTargets';

export const PROFILE_MINITOUR_ID = 'profile-minitour-v1';

export type MinitourTranslator = (key: string) => string;

const iconClassName = 'h-5 w-5 text-[var(--color-accent)]';

export function buildProfileMinitourSteps(t: MinitourTranslator): Step[] {
  return [
    {
      target: getProfileTourTargetSelector('hero'),
      title: t('profileTour.steps.hero.title'),
      content: t('profileTour.steps.hero.content'),
      placement: 'bottom',
      skipBeacon: true,
      data: { icon: <UserRound className={iconClassName} /> },
    },
    {
      target: getProfileTourTargetSelector('avatar'),
      title: t('profileTour.steps.avatar.title'),
      content: t('profileTour.steps.avatar.content'),
      placement: 'right',
      skipBeacon: true,
      data: { icon: <Camera className={iconClassName} /> },
    },
    {
      target: getProfileTourTargetSelector('summary'),
      title: t('profileTour.steps.summary.title'),
      content: t('profileTour.steps.summary.content'),
      placement: 'bottom',
      skipBeacon: true,
      data: { icon: <User className={iconClassName} /> },
    },
    {
      target: getProfileTourTargetSelector('stats'),
      title: t('profileTour.steps.stats.title'),
      content: t('profileTour.steps.stats.content'),
      placement: 'left',
      skipBeacon: true,
      data: { icon: <BarChart3 className={iconClassName} /> },
    },
    {
      target: getProfileTourTargetSelector('tabs'),
      title: t('profileTour.steps.tabs.title'),
      content: t('profileTour.steps.tabs.content'),
      placement: 'bottom',
      skipBeacon: true,
      data: { icon: <SlidersHorizontal className={iconClassName} /> },
    },
    {
      target: getProfileTourTargetSelector('personalForm'),
      title: t('profileTour.steps.personalForm.title'),
      content: t('profileTour.steps.personalForm.content'),
      placement: 'top',
      skipBeacon: true,
      data: { icon: <User className={iconClassName} /> },
    },
    {
      target: getProfileTourTargetSelector('securitySection'),
      title: t('profileTour.steps.security.title'),
      content: t('profileTour.steps.security.content'),
      placement: 'top',
      skipBeacon: true,
      data: { icon: <Lock className={iconClassName} /> },
    },
  ];
}
