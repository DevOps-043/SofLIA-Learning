import { CheckCircle2 } from 'lucide-react';
import type { TFunction } from 'i18next';

import type { TTSAudioOperationResult } from './useAdminTTSAudioPage';

interface ResultAlertsProps {
  error: string | null;
  result: TTSAudioOperationResult | null;
  t: TFunction<'admin'>;
}

function formatResult(result: TTSAudioOperationResult, t: TFunction<'admin'>) {
  if (result.kind === 'backfill') {
    return t('ttsAudio.results.backfill', { queued: result.queued, scanned: result.scanned });
  }
  if (result.kind === 'drain') {
    if (result.quotaReached) {
      return t('ttsAudio.results.drainQuotaReached', {
        limit: result.quotaLimit ?? 0,
      });
    }

    return t('ttsAudio.results.drain', {
      deferred: result.deferred ?? 0,
      failed: result.failed ?? 0,
      prepared: result.prepared ?? 0,
      processed: result.processed,
      quotaRemaining: result.quotaRemaining ?? 0,
    });
  }
  if (result.kind === 'cleanup') {
    return t('ttsAudio.results.cleanup', { deletedJobs: result.deletedJobs, scanned: result.scanned });
  }
  if (result.kind === 'retry') {
    return t('ttsAudio.results.retry', { requeued: result.requeued });
  }
  return t('ttsAudio.results.reprocess', { jobId: result.jobId });
}

export function ResultAlerts({ error, result, t }: ResultAlertsProps) {
  if (!error && !result) return null;

  return (
    <div className="mb-6 space-y-2">
      {result ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4" />
          {formatResult(result, t)}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {t('ttsAudio.results.error', { error })}
        </div>
      ) : null}
    </div>
  );
}
