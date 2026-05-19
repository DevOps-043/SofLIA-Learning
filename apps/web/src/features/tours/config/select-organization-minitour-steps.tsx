import React from 'react';
import type { SofliaJoyrideStep as Step } from '@/features/tours/types/joyride';
import { ArrowRightCircle, Building2, Hash, ShieldCheck, Users } from 'lucide-react';

import { getSelectOrganizationTourTargetSelector } from '../../../core/constants/tourTargets';
import type { MinitourTranslator } from './profile-minitour-steps';

export const SELECT_ORGANIZATION_MINITOUR_ID = 'select-organization-minitour-v1';

const iconClassName = 'h-5 w-5 text-[var(--color-accent)]';

export function buildSelectOrganizationMinitourSteps(t: MinitourTranslator): Step[] {
  return [
    {
      target: getSelectOrganizationTourTargetSelector('header'),
      title: t('selectOrganizationTour.steps.header.title'),
      content: t('selectOrganizationTour.steps.header.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: { icon: <Building2 className={iconClassName} /> },
    },
    {
      target: getSelectOrganizationTourTargetSelector('counter'),
      title: t('selectOrganizationTour.steps.counter.title'),
      content: t('selectOrganizationTour.steps.counter.content'),
      placement: 'bottom',
      disableBeacon: true,
      data: { icon: <Users className={iconClassName} /> },
    },
    {
      target: getSelectOrganizationTourTargetSelector('card'),
      title: t('selectOrganizationTour.steps.card.title'),
      content: t('selectOrganizationTour.steps.card.content'),
      placement: 'top',
      disableBeacon: true,
      data: { icon: <Building2 className={iconClassName} /> },
    },
    {
      target: getSelectOrganizationTourTargetSelector('role'),
      title: t('selectOrganizationTour.steps.role.title'),
      content: t('selectOrganizationTour.steps.role.content'),
      placement: 'top',
      disableBeacon: true,
      data: { icon: <ShieldCheck className={iconClassName} /> },
    },
    {
      target: getSelectOrganizationTourTargetSelector('action'),
      title: t('selectOrganizationTour.steps.action.title'),
      content: t('selectOrganizationTour.steps.action.content'),
      placement: 'left',
      disableBeacon: true,
      data: { icon: <ArrowRightCircle className={iconClassName} /> },
    },
    {
      target: getSelectOrganizationTourTargetSelector('grid'),
      title: t('selectOrganizationTour.steps.slug.title'),
      content: t('selectOrganizationTour.steps.slug.content'),
      placement: 'top',
      disableBeacon: true,
      data: { icon: <Hash className={iconClassName} /> },
    },
  ];
}
