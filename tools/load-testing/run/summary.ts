import { runSummaryPath, writeJson } from '../files';
import type { LoadProfile, RunSummary } from '../types';
import type { getConfig } from '../config';

export async function writeRunSummary(params: {
  aborted: boolean;
  abortReason?: string;
  config: ReturnType<typeof getConfig>;
  metricsFile: string;
  profile: LoadProfile;
  snapshotsFile: string;
  startedAt: string;
}) {
  const summary: RunSummary = {
    runId: params.config.runId,
    profile: params.profile.name,
    startedAt: params.startedAt,
    endedAt: new Date().toISOString(),
    baseUrl: params.config.baseUrl,
    stages: params.profile.stages,
    maxVus: params.profile.maxVus,
    aiRatio: params.config.aiRatio,
    aborted: params.aborted,
    abortReason: params.abortReason,
    metricsFile: params.metricsFile,
    snapshotsFile: params.snapshotsFile,
  };

  await writeJson(runSummaryPath(params.config.resultDir), summary);
  return runSummaryPath(params.config.resultDir);
}
