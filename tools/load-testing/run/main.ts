import fs from 'node:fs/promises';

import { appendSnapshot, collectSnapshot } from '../collect-metrics';
import { assertSafeTarget, getConfig, parseProfileName, resolveProfile } from '../config';
import { ensureResultDir, JsonlWriter, metricsPath, readSeedManifest, snapshotsPath } from '../files';
import type { RequestMetric } from '../types';
import { createCounters } from './counters';
import { monitorLoadRun } from './monitor';
import { validateTargetUsesSeededSessions } from './preflight';
import { targetAt, totalDurationSec } from './schedule';
import { writeRunSummary } from './summary';
import { assertUserPoolSize } from './user-pool';
import { virtualUserLoop } from './virtual-user-loop';

export async function runLoadTest() {
  const profileName = parseProfileName(process.argv[2] || process.env.LOAD_PROFILE);
  const config = getConfig();
  assertSafeTarget(config);
  await ensureResultDir(config.resultDir);

  const manifest = await readSeedManifest(config.resultDir);
  const profile = resolveProfile(profileName, config.targetVus);
  assertUserPoolSize({ allowUserReuse: config.allowUserReuse, profile, users: manifest.users });

  const metricsFile = metricsPath(config.resultDir);
  const snapshotsFile = snapshotsPath(config.resultDir);
  const metricWriter = new JsonlWriter<RequestMetric>(metricsFile);
  await metricWriter.reset();
  await fs.writeFile(snapshotsFile, '', 'utf8');

  await validateTargetUsesSeededSessions({
    baseUrl: config.baseUrl,
    manifestUsers: manifest.users,
    requestTimeoutMs: config.requestTimeoutMs,
    runId: config.runId,
  });

  const counters = createCounters();
  const completedLessonUsers = new Set<string>();
  const publicFlowCompletedUsers = new Set<string>();
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const endTime = startTime + totalDurationSec(profile) * 1000;
  const getCurrentTarget = () => targetAt(profile, (Date.now() - startTime) / 1000);

  await appendSnapshot(config, await collectSnapshot(config, 'before'));
  console.log(`Running ${profile.name} profile against ${config.baseUrl}`);
  console.log(`Run id: ${config.runId}. Results: ${config.resultDir}`);
  console.log(`Public flow mode: ${config.publicFlowMode}. Think time: ${config.thinkTimeMs}ms + jitter ${config.thinkTimeJitterMs}ms.`);

  let aborted = false;
  const workers = Array.from({ length: profile.maxVus }, (_, index) =>
    virtualUserLoop({
      virtualUserIndex: index + 1,
      users: manifest.users,
      profile,
      endTime,
      getCurrentTarget,
      stopSignal: () => aborted,
      manifestCourseSlug: manifest.courseSlug,
      runId: config.runId,
      baseUrl: config.baseUrl,
      aiRatio: config.aiRatio,
      requestTimeoutMs: config.requestTimeoutMs,
      thinkTimeMs: config.thinkTimeMs,
      thinkTimeJitterMs: config.thinkTimeJitterMs,
      publicFlowMode: config.publicFlowMode,
      metricWriter,
      counters,
      completedLessonUsers,
      publicFlowCompletedUsers,
    }),
  );

  const monitorResult = await monitorLoadRun({ config, counters, endTime, getCurrentTarget, profile, startTime });
  aborted = monitorResult.aborted;
  await Promise.allSettled(workers);
  await metricWriter.flush();
  await appendSnapshot(config, await collectSnapshot(config, 'after'));

  const summaryPath = await writeRunSummary({ ...monitorResult, config, metricsFile, profile, snapshotsFile, startedAt });
  if (monitorResult.aborted) {
    console.error(`Load run aborted: ${monitorResult.abortReason}`);
    process.exitCode = 2;
  } else {
    console.log(`Load run complete: ${summaryPath}`);
  }
}
