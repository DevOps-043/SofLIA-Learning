'use client';

import { useTranslation } from 'react-i18next';

import { ActionBar } from './admin-tts-audio/ActionBar';
import { DiagnosticsBanner } from './admin-tts-audio/DiagnosticsBanner';
import { JobsTable } from './admin-tts-audio/JobsTable';
import { PageHeader } from './admin-tts-audio/PageHeader';
import { ResultAlerts } from './admin-tts-audio/ResultAlerts';
import { StatusTiles } from './admin-tts-audio/StatusTiles';
import { useAdminTTSAudioPage } from './admin-tts-audio/useAdminTTSAudioPage';

export function AdminTTSAudioPage() {
  const { t } = useTranslation('admin');
  const state = useAdminTTSAudioPage();

  return (
    <div className="mx-auto max-w-7xl p-6">
      <PageHeader onRefresh={state.fetchJobs} t={t} />
      <DiagnosticsBanner
        diagnostics={state.diagnostics}
        isDiagnosing={state.isDiagnosing}
        onRunDiagnostics={state.runDiagnostics}
        t={t}
      />
      <ActionBar
        backfillResource={state.backfillResource}
        isBackfilling={state.isBackfilling}
        isCleaning={state.isCleaning}
        isDraining={state.isDraining}
        isRetrying={state.isRetrying}
        onBackfill={state.triggerBackfill}
        onCleanup={state.triggerCleanup}
        onDrain={state.triggerDrain}
        onResourceChange={state.setBackfillResource}
        onRetryFailed={state.triggerRetryFailed}
        t={t}
      />
      <ResultAlerts error={state.error} result={state.lastResult} t={t} />
      <StatusTiles summary={state.data?.summary} t={t} />
      <JobsTable
        data={state.data}
        isLoading={state.isLoading}
        languageFilter={state.languageFilter}
        onLanguageFilterChange={state.setLanguageFilter}
        onReprocessJob={state.triggerReprocessJob}
        onSourceTypeFilterChange={state.setSourceTypeFilter}
        onStatusFilterChange={state.setStatusFilter}
        sourceTypeFilter={state.sourceTypeFilter}
        statusFilter={state.statusFilter}
        t={t}
      />
    </div>
  );
}
