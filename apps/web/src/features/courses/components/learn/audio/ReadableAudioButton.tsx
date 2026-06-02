'use client';

import { Loader2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import type { TFunction } from 'i18next';

import type { ReadableAudioPlaybackStatus } from './useReadableAudioPlayback';

export function getReadableAudioLabel(
  status: ReadableAudioPlaybackStatus,
  t: TFunction<'learn'>,
): string {
  if (status === 'loading') return t('reading.voice.generating');
  if (status === 'playing') return t('reading.voice.pause');
  if (status === 'paused') return t('reading.voice.resume');
  if (status === 'error') return t('reading.voice.error');
  return t('reading.voice.listen');
}

export function ReadableAudioButton({
  label,
  onClick,
  status,
}: {
  label: string;
  onClick: () => void;
  status: ReadableAudioPlaybackStatus;
}) {
  const isLoading = status === 'loading';
  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isError = status === 'error';
  const isActive = isPlaying || isLoading || isPaused;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
      className={`inline-flex min-h-7 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors
        ${isError ? 'text-red-500 dark:text-red-400' : ''}
        ${isActive ? 'bg-accent/10 text-accent dark:bg-accent/15 dark:text-accent' : ''}
        ${!isActive && !isError ? 'text-gray-500 hover:bg-gray-200 dark:text-white/40 dark:hover:bg-white/10' : ''}
      `}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {isPlaying && <Pause className="h-3.5 w-3.5 fill-current" />}
      {isPaused && <Play className="h-3.5 w-3.5 fill-current" />}
      {isError && <VolumeX className="h-3.5 w-3.5" />}
      {!isLoading && !isPlaying && !isPaused && !isError && <Volume2 className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
