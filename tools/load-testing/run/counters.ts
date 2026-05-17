import type { JsonlWriter } from '../files';
import type { LoadProfile, RequestMetric } from '../types';

export interface Counters {
  total: number;
  failed: number;
  status5xx: number;
  status429: number;
  edge403Html: number;
  timeouts: number;
}

export function createCounters(): Counters {
  return {
    total: 0,
    failed: 0,
    status5xx: 0,
    status429: 0,
    edge403Html: 0,
    timeouts: 0,
  };
}

export function observeAbort(profileName: LoadProfile['name'], counters: Counters) {
  if (counters.total < 100) return undefined;

  const errorRate = counters.failed / counters.total;
  if (counters.edge403Html >= 100) {
    return `Netlify Edge returned ${counters.edge403Html} HTML 403 responses from the load runner`;
  }

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

export async function runRequest(
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
  if (result.status === 403 && result.error?.toLowerCase().includes('<!doctype html>')) {
    counters.edge403Html += 1;
  }
  if (result.status === 0 || result.error?.toLowerCase().includes('abort')) {
    counters.timeouts += 1;
  }
  return result;
}
