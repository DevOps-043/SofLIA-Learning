'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { OnboardingStep } from './types';

export function useOnboardingSteps(): OnboardingStep[] {
  const { t } = useTranslation('common');

  return useMemo(
    () => [
      {
        id: 1,
        title: t('onboarding.steps.1.title'),
        description: t('onboarding.steps.1.description'),
        speech: t('onboarding.steps.1.speech'),
      },
      {
        id: 2,
        title: t('onboarding.steps.2.title'),
        description: t('onboarding.steps.2.description'),
        speech: t('onboarding.steps.2.speech'),
        action: {
          label: t('onboarding.steps.2.actionLabel'),
          path: '/dashboard',
        },
      },
      {
        id: 3,
        title: t('onboarding.steps.3.title'),
        description: t('onboarding.steps.3.description'),
        speech: t('onboarding.steps.3.speech'),
        action: {
          label: t('onboarding.steps.3.actionLabel'),
          path: '/courses',
        },
      },
      {
        id: 4,
        title: t('onboarding.steps.4.title'),
        description: t('onboarding.steps.4.description'),
        speech: t('onboarding.steps.4.speech'),
        action: {
          label: t('onboarding.steps.4.actionLabel'),
          path: '/dashboard',
        },
      },
    ] satisfies OnboardingStep[],
    [t]
  );
}
