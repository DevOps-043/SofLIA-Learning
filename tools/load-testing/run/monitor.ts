import { appendSnapshot, collectSnapshot } from '../collect-metrics';
import { sleep } from '../http';
import type { LoadProfile } from '../types';
import type { getConfig } from '../config';
import type { Counters } from './counters';
import { observeAbort } from './counters';

export async function monitorLoadRun(params: {
  config: ReturnType<typeof getConfig>;
  counters: Counters;
  endTime: number;
  getCurrentTarget: () => number;
  profile: LoadProfile;
  startTime: number;
}) {
  let aborted = false;
  let abortReason: string | undefined;

  while (Date.now() < params.endTime && !aborted) {
    await sleep(10000);
    const elapsedSec = Math.floor((Date.now() - params.startTime) / 1000);
    const errorRate = params.counters.total > 0
      ? (params.counters.failed / params.counters.total) * 100
      : 0;

    console.log(
      `[${elapsedSec}s] target=${params.getCurrentTarget()} total=${params.counters.total} failed=${params.counters.failed} errorRate=${errorRate.toFixed(2)}% 5xx=${params.counters.status5xx} 429=${params.counters.status429} edge403=${params.counters.edge403Html}`,
    );

    if (elapsedSec > 60 && elapsedSec % 60 === 0) {
      await appendSnapshot(params.config, await collectSnapshot(params.config, `during-${elapsedSec}s`));
    }

    const reason = observeAbort(params.profile.name, params.counters);
    if (reason) {
      aborted = true;
      abortReason = reason;
    }
  }

  return { aborted, abortReason };
}
