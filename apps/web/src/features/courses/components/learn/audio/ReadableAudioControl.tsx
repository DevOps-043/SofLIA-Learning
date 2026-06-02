'use client';

import { useTranslation } from 'react-i18next';

import type { ReadableAudioSource } from './useReadableAudioPlayback';
import { useReadableAudioPlayback } from './useReadableAudioPlayback';
import {
  ReadableAudioButton,
  getReadableAudioLabel,
} from './ReadableAudioButton';

export function ReadableAudioControl({ source }: { source: ReadableAudioSource }) {
  const { t, i18n } = useTranslation('learn');
  const playback = useReadableAudioPlayback({
    ...source,
    language: source.language ?? i18n.language,
  });

  return (
    <ReadableAudioButton
      status={playback.status}
      label={getReadableAudioLabel(playback.status, t)}
      onClick={() => {
        void playback.speak();
      }}
    />
  );
}
