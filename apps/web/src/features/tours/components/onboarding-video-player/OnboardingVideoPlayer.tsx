'use client';

import { useTranslation } from 'react-i18next';
import type { OnboardingVideoPlayerProps } from './types';
import { OnboardingVideoStage } from './OnboardingVideoStage';
import { useOnboardingVideoPlayer } from './useOnboardingVideoPlayer';

export function OnboardingVideoPlayer({ videos, onComplete, isSkippable = true }: OnboardingVideoPlayerProps) {
  const { t } = useTranslation('common');
  const player = useOnboardingVideoPlayer({ onComplete, videos });

  if (!videos || videos.length === 0) return null;

  return (
    <OnboardingVideoStage
      isSkippable={isSkippable}
      labels={{
        loadErrorDescription: t('media.introPlayer.loadErrorDescription'),
        loadErrorTitle: t('media.introPlayer.loadErrorTitle'),
        retry: t('actions.retry'),
        skipIntro: t('onboarding.buttons.skipIntro'),
        skipToContent: t('media.introPlayer.skipToContent'),
        slowConnection: t('media.introPlayer.slowConnection'),
      }}
      onComplete={onComplete}
      player={player}
      totalVideos={videos.length}
    />
  );
}
