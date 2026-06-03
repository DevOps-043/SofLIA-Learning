'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  backfillReadingAudio,
  cleanupNonTargetReadingAudioJobs,
  drainReadingAudioQueue,
  fetchDiagnostics,
  fetchReadingAudioJobs,
  reprocessReadingAudioJob,
  retryFailedReadingAudioJobs,
} from './api';
import { REFRESH_INTERVAL_MS } from './constants';
import type {
  BackfillResponse,
  DiagnosticsResponse,
  DrainResponse,
  JobsApiResponse,
  ReadingAudioJobStatus,
  ReadingAudioLanguage,
  ReadingAudioResource,
  ReadingAudioSourceType,
  ReprocessResponse,
} from './types';

export type TTSAudioOperationResult =
  | { kind: 'backfill'; queued: number; scanned: number }
  | { deletedJobs: number; kind: 'cleanup'; scanned: number }
  | { kind: 'drain'; processed: number }
  | { kind: 'retry'; requeued: number }
  | { jobId: string; kind: 'reprocess' };

export function useAdminTTSAudioPage() {
  const [backfillResource, setBackfillResource] = useState<ReadingAudioResource>('all');
  const [data, setData] = useState<JobsApiResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isDraining, setIsDraining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<ReadingAudioLanguage | 'all'>('all');
  const [lastResult, setLastResult] = useState<TTSAudioOperationResult | null>(null);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<ReadingAudioSourceType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ReadingAudioJobStatus | 'all'>('all');

  const fetchJobs = useCallback(async () => {
    try {
      setData(await fetchReadingAudioJobs({
        language: languageFilter,
        sourceType: sourceTypeFilter,
        status: statusFilter,
      }));
      setError(null);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }, [languageFilter, sourceTypeFilter, statusFilter]);

  const runDiagnostics = useCallback(async () => {
    setIsDiagnosing(true);
    try {
      setDiagnostics(await fetchDiagnostics());
    } catch (issue) {
      setDiagnostics({
        bucketReady: false,
        cronSecretReady: false,
        providerReady: false,
        summary: {
          healthy: false,
          problems: [issue instanceof Error ? issue.message : 'No se pudo ejecutar el diagnostico'],
        },
        totals: { failed: 0, generating: 0, pending: 0, ready: 0 },
      });
    } finally {
      setIsDiagnosing(false);
    }
  }, []);

  const showBackfillResult = (result: BackfillResponse) => {
    setLastResult({ kind: 'backfill', queued: result.queued, scanned: result.scanned });
  };

  const showDrainResult = (result: DrainResponse) => {
    setLastResult({ kind: 'drain', processed: result.processed });
  };

  const triggerCleanup = useCallback(async () => {
    setIsCleaning(true);
    try {
      const result = await cleanupNonTargetReadingAudioJobs();
      setLastResult({ deletedJobs: result.deletedJobs, kind: 'cleanup', scanned: result.scanned });
      await fetchJobs();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Error limpiando cola');
    } finally {
      setIsCleaning(false);
    }
  }, [fetchJobs]);

  const showReprocessResult = (result: ReprocessResponse) => {
    setLastResult(
      result.retryFailed
        ? { kind: 'retry', requeued: result.requeued ?? 0 }
        : { jobId: result.jobId ?? '', kind: 'reprocess' },
    );
  };

  const triggerBackfill = useCallback(async () => {
    setIsBackfilling(true);
    try {
      const result = await backfillReadingAudio({
        language: languageFilter,
        resource: backfillResource,
      });
      showBackfillResult(result);
      await fetchJobs();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Error al encolar audios');
    } finally {
      setIsBackfilling(false);
    }
  }, [backfillResource, fetchJobs, languageFilter]);

  const triggerDrain = useCallback(async () => {
    setIsDraining(true);
    try {
      showDrainResult(await drainReadingAudioQueue());
      await fetchJobs();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Error al procesar cola');
    } finally {
      setIsDraining(false);
    }
  }, [fetchJobs]);

  const triggerRetryFailed = useCallback(async () => {
    setIsRetrying(true);
    try {
      showReprocessResult(await retryFailedReadingAudioJobs());
      await fetchJobs();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Error al reintentar jobs');
    } finally {
      setIsRetrying(false);
    }
  }, [fetchJobs]);

  const triggerReprocessJob = useCallback(async (jobId: string) => {
    try {
      showReprocessResult(await reprocessReadingAudioJob(jobId));
      await fetchJobs();
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : 'Error al reprocesar job');
    }
  }, [fetchJobs]);

  useEffect(() => { void runDiagnostics(); }, [runDiagnostics]);

  useEffect(() => {
    void fetchJobs();
    const interval = window.setInterval(fetchJobs, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [fetchJobs]);

  return {
    backfillResource,
    data,
    diagnostics,
    error,
    fetchJobs,
    isBackfilling,
    isCleaning,
    isDiagnosing,
    isDraining,
    isLoading,
    isRetrying,
    languageFilter,
    lastResult,
    runDiagnostics,
    setBackfillResource,
    setLanguageFilter,
    setSourceTypeFilter,
    setStatusFilter,
    sourceTypeFilter,
    statusFilter,
    triggerBackfill,
    triggerCleanup,
    triggerDrain,
    triggerReprocessJob,
    triggerRetryFailed,
  };
}
