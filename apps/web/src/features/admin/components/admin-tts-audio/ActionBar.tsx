import { PlayCircle, RefreshCw, RotateCcw, Trash2, WandSparkles } from 'lucide-react';
import type { TFunction } from 'i18next';

import { RESOURCE_KEYS } from './constants';
import type { ReadingAudioResource } from './types';

interface ActionBarProps {
  backfillResource: ReadingAudioResource;
  isBackfilling: boolean;
  isCleaning: boolean;
  isDraining: boolean;
  isRetrying: boolean;
  onBackfill: () => void;
  onCleanup: () => void;
  onDrain: () => void;
  onRetryFailed: () => void;
  onResourceChange: (resource: ReadingAudioResource) => void;
  t: TFunction<'admin'>;
}

export function ActionBar({
  backfillResource,
  isBackfilling,
  isCleaning,
  isDraining,
  isRetrying,
  onBackfill,
  onCleanup,
  onDrain,
  onRetryFailed,
  onResourceChange,
  t,
}: ActionBarProps) {
  const isBusy = isBackfilling || isCleaning || isDraining || isRetrying;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-white/60">
        {t('ttsAudio.filters.resource')}
        <select
          value={backfillResource}
          onChange={(event) => onResourceChange(event.target.value as ReadingAudioResource)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-primary dark:border-white/10 dark:bg-white/[0.04] dark:text-white"
        >
          {RESOURCE_KEYS.map((resource) => (
            <option key={resource} value={resource}>
              {t(`ttsAudio.resources.${resource}`)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={onBackfill}
        disabled={isBusy}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
      >
        {isBackfilling ? <RefreshCw className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
        {t('ttsAudio.actions.backfill')}
      </button>
      <button
        type="button"
        onClick={onDrain}
        disabled={isBusy}
        className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/5 disabled:opacity-60 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
      >
        <PlayCircle className={`h-4 w-4 ${isDraining ? 'animate-pulse' : ''}`} />
        {t('ttsAudio.actions.drain')}
      </button>
      <button
        type="button"
        onClick={onRetryFailed}
        disabled={isBusy}
        className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-primary/30 hover:text-primary disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:text-accent"
      >
        <RotateCcw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
        {t('ttsAudio.actions.retryFailed')}
      </button>
      <button
        type="button"
        onClick={onCleanup}
        disabled={isBusy}
        className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10"
      >
        <Trash2 className={`h-4 w-4 ${isCleaning ? 'animate-pulse' : ''}`} />
        {t('ttsAudio.actions.cleanup')}
      </button>
    </div>
  );
}
