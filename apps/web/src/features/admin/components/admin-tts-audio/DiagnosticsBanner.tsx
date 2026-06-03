import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import type { TFunction } from 'i18next';

import type { DiagnosticsResponse } from './types';

interface DiagnosticsBannerProps {
  diagnostics: DiagnosticsResponse | null;
  isDiagnosing: boolean;
  onRunDiagnostics: () => void;
  t: TFunction<'admin'>;
}

export function DiagnosticsBanner({
  diagnostics,
  isDiagnosing,
  onRunDiagnostics,
  t,
}: DiagnosticsBannerProps) {
  const healthy = diagnostics?.summary.healthy;

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 rounded-lg p-2 ${healthy ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
            {healthy ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('ttsAudio.diagnostics.title')}
            </h2>
            <div className="mt-2 grid gap-1 text-xs text-gray-500 dark:text-white/60 sm:grid-cols-3">
              <span>{t('ttsAudio.diagnostics.provider', { value: diagnostics?.providerReady ? t('ttsAudio.common.ready') : t('ttsAudio.common.missing') })}</span>
              <span>{t('ttsAudio.diagnostics.bucket', { value: diagnostics?.bucketReady ? t('ttsAudio.common.ready') : t('ttsAudio.common.missing') })}</span>
              <span>{t('ttsAudio.diagnostics.cron', { value: diagnostics?.cronSecretReady ? t('ttsAudio.common.ready') : t('ttsAudio.common.missing') })}</span>
            </div>
            {diagnostics?.summary.problems.length ? (
              <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                {diagnostics.summary.problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-gray-500 dark:text-white/60">
                {t('ttsAudio.diagnostics.healthy')}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onRunDiagnostics}
          disabled={isDiagnosing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-primary/30 hover:text-primary disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:text-accent"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
          {t('ttsAudio.actions.runDiagnostics')}
        </button>
      </div>
    </div>
  );
}
