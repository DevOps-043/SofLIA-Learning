import fs from 'node:fs/promises';
import { assertSafeTarget, getConfig, parseProfileName, resolveProfile } from './config';
import {
  ensureResultDir,
  JsonlWriter,
  metricsPath,
  readSeedManifest,
  runSummaryPath,
  snapshotsPath,
  writeJson,
} from './files';
import { sleep, timedFetch } from './http';
import { appendSnapshot, collectSnapshot } from './collect-metrics';
import type { LoadProfile, QaUser, RequestMetric, RunSummary } from './types';

interface Counters {
  total: number;
  failed: number;
  status5xx: number;
  status429: number;
  timeouts: number;
}

function totalDurationSec(profile: LoadProfile) {
  return profile.stages.reduce((total, stage) => total + stage.durationSec, 0);
}

function targetAt(profile: LoadProfile, elapsedSec: number) {
  let startSec = 0;
  let fromTarget = 0;

  for (const stage of profile.stages) {
    const endSec = startSec + stage.durationSec;
    if (elapsedSec <= endSec) {
      const progress = stage.durationSec === 0 ? 1 : (elapsedSec - startSec) / stage.durationSec;
      return Math.max(0, Math.round(fromTarget + (stage.targetVus - fromTarget) * progress));
    }
    startSec = endSec;
    fromTarget = stage.targetVus;
  }

  return 0;
}

function userForIndex(users: QaUser[], virtualUserIndex: number): QaUser {
  const source = users[(virtualUserIndex - 1) % users.length];
  return {
    ...source,
    index: virtualUserIndex,
  };
}

function shouldCallAi(aiRatio: number) {
  return aiRatio > 0 && Math.random() < aiRatio;
}

function plannerDateRangePath() {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 1);

  const end = new Date(today);
  end.setDate(today.getDate() + 14);

  const params = new URLSearchParams({
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  });

  return `/api/study-planner/sessions?${params.toString()}`;
}

function observeAbort(profileName: string, counters: Counters) {
  if (counters.total < 100) return undefined;

  const errorRate = counters.failed / counters.total;
  if (profileName === 'load' || profileName === 'smoke') {
    if (counters.total >= 1000 && errorRate > 0.01) {
      return `nominal error rate exceeded 1% (${(errorRate * 100).toFixed(2)}%)`;
    }
    if (errorRate > 0.05) return `nominal error rate exceeded 5% (${(errorRate * 100).toFixed(2)}%)`;
    if (counters.status5xx > 25) return `more than 25 server errors observed (${counters.status5xx})`;
  }

  if (profileName === 'stress' || profileName === 'spike') {
    if (counters.status5xx > 250) return `stress server error ceiling exceeded (${counters.status5xx} 5xx)`;
    if (counters.timeouts > 5000) return `stress timeout ceiling exceeded (${counters.timeouts} timeouts)`;
    if (counters.status429 > 50000) return `stress rate-limit ceiling exceeded (${counters.status429} 429)`;
    if (counters.total >= 10000 && errorRate > 0.25) {
      return `stress error rate exceeded 25% (${(errorRate * 100).toFixed(2)}%)`;
    }
  }

  return undefined;
}

async function runRequest(
  metricWriter: JsonlWriter<RequestMetric>,
  counters: Counters,
  metric: Promise<RequestMetric>,
) {
  const result = await metric;
  metricWriter.write(result);
  counters.total += 1;
  if (!result.ok) counters.failed += 1;
  if (result.status >= 500) counters.status5xx += 1;
  if (result.status === 429) counters.status429 += 1;
  if (result.status === 0 || result.error?.toLowerCase().includes('abort')) {
    counters.timeouts += 1;
  }
  return result;
}

async function publicFlow(context: FlowContext) {
  const courseSlug = context.user.courseSlug || context.manifestCourseSlug;
  await context.get('public', 'home', '/');
  await context.get('public', 'business', '/business');
  await context.get('public', 'business-plans', '/business/plans');
  if (courseSlug) {
    await context.get('public', 'course-detail', `/courses/${courseSlug}`);
  }
}

async function authenticatedFlow(context: FlowContext) {
  await context.get('auth-core', 'auth-me', '/api/auth/me');
  await context.get('auth-core', 'my-courses', '/api/my-courses');
  await context.get('auth-core', 'my-courses-stats', '/api/my-courses?stats_only=true');
  await context.get('auth-core', 'org-dashboard', `/${context.user.orgSlug}/dashboard`);
  await context.get('auth-core', 'business-user-dashboard', `/${context.user.orgSlug}/business-user/dashboard`);
}

async function studyPlannerFlow(context: FlowContext) {
  await context.get('study-planner', 'dashboard-plan', '/api/study-planner/dashboard/plan');
  await context.get('study-planner', 'sessions', plannerDateRangePath());

  if (!context.user.lessonId) return;
  if (context.completedLessonUsers.has(context.user.userId)) return;

  const start = await context.post('study-planner', 'lesson-tracking-start', '/api/study-planner/lesson-tracking/start', {
    lessonId: context.user.lessonId,
    sessionId: context.user.sessionId,
    planId: context.user.planId,
    trigger: 'video_play',
    lessonTimeEstimates: {
      t_lesson_minutes: 30,
      t_video_minutes: 20,
      t_materials_minutes: 5,
    },
  }, true);

  let trackingId: string | undefined;
  let alreadyCompleted = false;
  try {
    const body = start.responseText
      ? (JSON.parse(start.responseText) as { alreadyCompleted?: boolean; trackingId?: string })
      : undefined;
    trackingId = body?.trackingId;
    alreadyCompleted = body?.alreadyCompleted === true;
  } catch {
    trackingId = undefined;
  }

  if (alreadyCompleted) {
    context.completedLessonUsers.add(context.user.userId);
    return;
  }

  await context.post('study-planner', 'lesson-tracking-event', '/api/study-planner/lesson-tracking/event', {
    trackingId: trackingId || context.seededTrackingId,
    eventType: 'activity',
  });

  if (Math.random() < 0.1) {
    const complete = await context.post('study-planner', 'lesson-tracking-complete', '/api/study-planner/lesson-tracking/complete', {
      lessonId: context.user.lessonId,
      endTrigger: 'manual',
    });
    if (complete.ok) {
      context.completedLessonUsers.add(context.user.userId);
    }
  }
}

async function aiFlow(context: FlowContext) {
  await context.post('lia', 'lia-chat', '/api/lia/chat', {
    stream: false,
    messages: [
      {
        role: 'user',
        content:
          'Estoy realizando una prueba QA de carga. Responde brevemente con un consejo de estudio para una leccion de IA empresarial.',
      },
    ],
    context: {
      userId: context.user.userId,
      organizationId: context.user.orgId,
      currentPage: 'load-test',
      language: 'es',
    },
  });
}

async function validateTargetUsesSeededSessions(params: {
  baseUrl: string;
  manifestUsers: QaUser[];
  requestTimeoutMs: number;
  runId: string;
}) {
  const firstUser = params.manifestUsers[0];
  if (!firstUser) {
    throw new Error('Seed manifest has no QA users. Run npm run load:seed first.');
  }

  const result = await timedFetch({
    runId: params.runId,
    profile: 'manual',
    flow: 'preflight',
    name: 'auth-me-preflight',
    baseUrl: params.baseUrl,
    path: '/api/auth/me',
    user: firstUser,
    timeoutMs: params.requestTimeoutMs,
    captureResponseText: true,
  });

  if (result.ok) return;

  const detail = result.error || result.responseText || 'No response body';
  throw new Error(
    [
      `Authenticated preflight failed before starting load: /api/auth/me returned ${result.status}.`,
      `Response: ${detail}`,
      'The Netlify target is not accepting the seeded QA legacy session.',
      'Verify that the Netlify branch/deploy-preview environment points to the same Supabase project used by LOAD_TEST_SUPABASE_URL, redeploy Netlify, then rerun npm run load:seed.',
    ].join(' ')
  );
}

class FlowContext {
  readonly seededTrackingId: string;

  constructor(
    readonly runId: string,
    readonly profileName: LoadProfile['name'],
    readonly baseUrl: string,
    readonly user: QaUser,
    readonly manifestCourseSlug: string | undefined,
    readonly requestTimeoutMs: number,
    readonly metricWriter: JsonlWriter<RequestMetric>,
    readonly counters: Counters,
    readonly completedLessonUsers: Set<string>,
  ) {
    this.seededTrackingId = this.user.trackingId || '';
  }

  get(flow: string, name: string, path: string) {
    return runRequest(
      this.metricWriter,
      this.counters,
      timedFetch({
        runId: this.runId,
        profile: this.profileName,
        flow,
        name,
        baseUrl: this.baseUrl,
        path,
        user: flow === 'public' ? undefined : this.user,
        timeoutMs: this.requestTimeoutMs,
      }),
    );
  }

  post(flow: string, name: string, path: string, body: unknown, captureResponseText = false) {
    return runRequest(
      this.metricWriter,
      this.counters,
      timedFetch({
        runId: this.runId,
        profile: this.profileName,
        flow,
        name,
        method: 'POST',
        baseUrl: this.baseUrl,
        path,
        user: this.user,
        body,
        timeoutMs: this.requestTimeoutMs,
        captureResponseText,
      }),
    );
  }
}

async function virtualUserLoop(params: {
  virtualUserIndex: number;
  users: QaUser[];
  profile: LoadProfile;
  startTime: number;
  endTime: number;
  getCurrentTarget: () => number;
  stopSignal: () => boolean;
  manifestCourseSlug?: string;
  runId: string;
  baseUrl: string;
  aiRatio: number;
  requestTimeoutMs: number;
  thinkTimeMs: number;
  metricWriter: JsonlWriter<RequestMetric>;
  counters: Counters;
  completedLessonUsers: Set<string>;
}) {
  const user = userForIndex(params.users, params.virtualUserIndex);

  while (Date.now() < params.endTime && !params.stopSignal()) {
    if (params.virtualUserIndex > params.getCurrentTarget()) {
      await sleep(1000);
      continue;
    }

    const context = new FlowContext(
      params.runId,
      params.profile.name,
      params.baseUrl,
      user,
      params.manifestCourseSlug,
      params.requestTimeoutMs,
      params.metricWriter,
      params.counters,
      params.completedLessonUsers,
    );

    await publicFlow(context);
    await sleep(params.thinkTimeMs);
    await authenticatedFlow(context);
    await sleep(params.thinkTimeMs);
    await studyPlannerFlow(context);

    if (shouldCallAi(params.aiRatio)) {
      await sleep(params.thinkTimeMs);
      await aiFlow(context);
    }

    await sleep(params.thinkTimeMs);
  }
}

async function main() {
  const profileName = parseProfileName(process.argv[2] || process.env.LOAD_PROFILE);
  const config = getConfig();
  assertSafeTarget(config);
  await ensureResultDir(config.resultDir);

  const manifest = await readSeedManifest(config.resultDir);
  const profile = resolveProfile(profileName, config.targetVus);
  const metricsFile = metricsPath(config.resultDir);
  const snapshotsFile = snapshotsPath(config.resultDir);
  const metricWriter = new JsonlWriter<RequestMetric>(metricsFile);
  await metricWriter.reset();
  await fs.writeFile(snapshotsFile, '', 'utf8');

  if (manifest.users.length < profile.maxVus) {
    const message =
      `User pool has ${manifest.users.length} users but profile needs ${profile.maxVus}. ` +
      `Run load:seed with LOAD_SEED_USERS=${profile.maxVus}, or set LOAD_ALLOW_USER_REUSE=true only for an explicit synthetic saturation test.`;

    if (!config.allowUserReuse) {
      throw new Error(message);
    }

    console.warn(`${message} Users will be reused.`);
  }

  await validateTargetUsesSeededSessions({
    baseUrl: config.baseUrl,
    manifestUsers: manifest.users,
    requestTimeoutMs: config.requestTimeoutMs,
    runId: config.runId,
  });

  const counters: Counters = {
    total: 0,
    failed: 0,
    status5xx: 0,
    status429: 0,
    timeouts: 0,
  };
  const completedLessonUsers = new Set<string>();
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const endTime = startTime + totalDurationSec(profile) * 1000;
  let aborted = false;
  let abortReason: string | undefined;

  await appendSnapshot(config, await collectSnapshot(config, 'before'));

  const getCurrentTarget = () => targetAt(profile, (Date.now() - startTime) / 1000);
  const stopSignal = () => aborted;

  console.log(`Running ${profile.name} profile against ${config.baseUrl}`);
  console.log(`Run id: ${config.runId}. Results: ${config.resultDir}`);

  const workers = Array.from({ length: profile.maxVus }, (_, index) =>
    virtualUserLoop({
      virtualUserIndex: index + 1,
      users: manifest.users,
      profile,
      startTime,
      endTime,
      getCurrentTarget,
      stopSignal,
      manifestCourseSlug: manifest.courseSlug,
      runId: config.runId,
      baseUrl: config.baseUrl,
      aiRatio: config.aiRatio,
      requestTimeoutMs: config.requestTimeoutMs,
      thinkTimeMs: config.thinkTimeMs,
      metricWriter,
      counters,
      completedLessonUsers,
    }),
  );

  while (Date.now() < endTime && !aborted) {
    await sleep(10000);
    const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
    const currentTarget = getCurrentTarget();
    const errorRate = counters.total > 0 ? (counters.failed / counters.total) * 100 : 0;
    console.log(
      `[${elapsedSec}s] target=${currentTarget} total=${counters.total} failed=${counters.failed} errorRate=${errorRate.toFixed(2)}% 5xx=${counters.status5xx} 429=${counters.status429}`
    );

    if (elapsedSec > 60 && elapsedSec % 60 === 0) {
      await appendSnapshot(config, await collectSnapshot(config, `during-${elapsedSec}s`));
    }

    const reason = observeAbort(profile.name, counters);
    if (reason) {
      aborted = true;
      abortReason = reason;
    }
  }

  await Promise.allSettled(workers);
  await metricWriter.flush();
  await appendSnapshot(config, await collectSnapshot(config, 'after'));

  const summary: RunSummary = {
    runId: config.runId,
    profile: profile.name,
    startedAt,
    endedAt: new Date().toISOString(),
    baseUrl: config.baseUrl,
    stages: profile.stages,
    maxVus: profile.maxVus,
    aiRatio: config.aiRatio,
    aborted,
    abortReason,
    metricsFile,
    snapshotsFile,
  };

  await writeJson(runSummaryPath(config.resultDir), summary);

  if (aborted) {
    console.error(`Load run aborted: ${abortReason}`);
    process.exitCode = 2;
  } else {
    console.log(`Load run complete: ${runSummaryPath(config.resultDir)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
