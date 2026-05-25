import type { LoadProfile, QaUser } from '../types';

export function totalDurationSec(profile: LoadProfile) {
  return profile.stages.reduce((total, stage) => total + stage.durationSec, 0);
}

export function targetAt(profile: LoadProfile, elapsedSec: number) {
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

export function userForIndex(users: QaUser[], virtualUserIndex: number): QaUser {
  const source = users[(virtualUserIndex - 1) % users.length];
  return { ...source, index: virtualUserIndex };
}

export function shouldCallAi(aiRatio: number) {
  return aiRatio > 0 && Math.random() < aiRatio;
}

export function thinkDelay(baseMs: number, jitterMs: number) {
  return baseMs + Math.floor(Math.random() * Math.max(0, jitterMs + 1));
}

export function plannerDateRangePath() {
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
