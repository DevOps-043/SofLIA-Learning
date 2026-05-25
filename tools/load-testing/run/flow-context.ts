import { timedFetch } from '../http';
import type { JsonlWriter } from '../files';
import type { LoadProfile, QaUser, RequestMetric } from '../types';
import { Counters, runRequest } from './counters';

export class FlowContext {
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
