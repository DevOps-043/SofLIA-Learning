import { Headphones, RefreshCw } from 'lucide-react';
import type { TFunction } from 'i18next';

interface PageHeaderProps {
  onRefresh: () => void;
  t: TFunction<'admin'>;
}

export function PageHeader({ onRefresh, t }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary dark:border-accent/20 dark:bg-accent/10 dark:text-accent">
          <Headphones className="h-3.5 w-3.5" />
          {t('ttsAudio.header.eyebrow')}
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t('ttsAudio.header.title')}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-white/60">
          {t('ttsAudio.header.subtitle')}
        </p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-primary/30 hover:text-primary dark:border-white/10 dark:text-white/70 dark:hover:text-accent"
      >
        <RefreshCw className="h-4 w-4" />
        {t('ttsAudio.actions.refresh')}
      </button>
    </div>
  );
}
