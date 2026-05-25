import type { JsonlWriter } from '../files';
import { sleep } from '../http';
import type { LoadProfile, QaUser, RequestMetric } from '../types';
import { aiFlow } from './ai-flow';
import type { Counters } from './counters';
import { FlowContext } from './flow-context';
import { authenticatedFlow, publicFlow } from './public-auth-flows';
import { shouldCallAi, thinkDelay, userForIndex } from './schedule';
import { studyPlannerFlow } from './study-planner-flow';

export async function virtualUserLoop(params: {
  virtualUserIndex: number;
  users: QaUser[];
  profile: LoadProfile;
  endTime: number;
  getCurrentTarget: () => number;
  stopSignal: () => boolean;
  manifestCourseSlug?: string;
  runId: string;
  baseUrl: string;
  aiRatio: number;
  requestTimeoutMs: number;
  thinkTimeMs: number;
  thinkTimeJitterMs: number;
  publicFlowMode: 'once' | 'always';
  metricWriter: JsonlWriter<RequestMetric>;
  counters: Counters;
  completedLessonUsers: Set<string>;
  publicFlowCompletedUsers: Set<string>;
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

    const shouldRunPublicFlow =
      params.publicFlowMode === 'always' ||
      !params.publicFlowCompletedUsers.has(user.userId);

    if (shouldRunPublicFlow) {
      await publicFlow(context);
      params.publicFlowCompletedUsers.add(user.userId);
      await sleep(thinkDelay(params.thinkTimeMs, params.thinkTimeJitterMs));
    }

    await authenticatedFlow(context);
    await sleep(thinkDelay(params.thinkTimeMs, params.thinkTimeJitterMs));
    await studyPlannerFlow(context);

    if (shouldCallAi(params.aiRatio)) {
      await sleep(thinkDelay(params.thinkTimeMs, params.thinkTimeJitterMs));
      await aiFlow(context);
    }

    await sleep(thinkDelay(params.thinkTimeMs, params.thinkTimeJitterMs));
  }
}
