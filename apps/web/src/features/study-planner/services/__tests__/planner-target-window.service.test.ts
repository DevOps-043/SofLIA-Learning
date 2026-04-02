import { describe, it, expect } from 'vitest';
import {
  parseStudyPlannerTargetDate,
  resolveStudyPlannerTargetWindow,
} from '../planner-target-window.service';

// ─── parseStudyPlannerTargetDate ──────────────────────────────────────────────

describe('parseStudyPlannerTargetDate', () => {
  it('returns null for undefined', () => {
    expect(parseStudyPlannerTargetDate(undefined)).toBeNull();
  });

  it('returns null for null', () => {
    expect(parseStudyPlannerTargetDate(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseStudyPlannerTargetDate('')).toBeNull();
  });

  it('returns null for "No tengo fecha específica"', () => {
    expect(parseStudyPlannerTargetDate('No tengo fecha específica')).toBeNull();
  });

  it('parses Spanish format "15 de enero de 2026"', () => {
    const result = parseStudyPlannerTargetDate('15 de enero de 2026');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(0); // enero = 0
    expect(result!.getDate()).toBe(15);
  });

  it('parses Spanish format "1 de diciembre de 2025"', () => {
    const result = parseStudyPlannerTargetDate('1 de diciembre de 2025');
    expect(result).not.toBeNull();
    expect(result!.getMonth()).toBe(11); // diciembre = 11
    expect(result!.getDate()).toBe(1);
  });

  it('parses all 12 Spanish month names', () => {
    const months = [
      ['enero', 0], ['febrero', 1], ['marzo', 2], ['abril', 3],
      ['mayo', 4], ['junio', 5], ['julio', 6], ['agosto', 7],
      ['septiembre', 8], ['octubre', 9], ['noviembre', 10], ['diciembre', 11],
    ];
    for (const [name, index] of months) {
      const result = parseStudyPlannerTargetDate(`15 de ${name} de 2025`);
      expect(result).not.toBeNull();
      expect(result!.getMonth()).toBe(index);
    }
  });

  it('parses standard ISO date string "2025-12-31"', () => {
    const result = parseStudyPlannerTargetDate('2025-12-31');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2025);
  });

  it('returns null for years before 2020', () => {
    const result = parseStudyPlannerTargetDate('15 de enero de 2019');
    expect(result).toBeNull();
  });

  it('returns null for invalid month name', () => {
    const result = parseStudyPlannerTargetDate('15 de unknownmonth de 2025');
    expect(result).toBeNull();
  });

  it('sets hours to 0,0,0,0 (midnight)', () => {
    const result = parseStudyPlannerTargetDate('15 de junio de 2025');
    expect(result).not.toBeNull();
    expect(result!.getHours()).toBe(0);
    expect(result!.getMinutes()).toBe(0);
    expect(result!.getSeconds()).toBe(0);
    expect(result!.getMilliseconds()).toBe(0);
  });

  it('returns null for complete garbage input', () => {
    const result = parseStudyPlannerTargetDate('blah blah blah');
    expect(result).toBeNull();
  });
});

// ─── resolveStudyPlannerTargetWindow ──────────────────────────────────────────

describe('resolveStudyPlannerTargetWindow', () => {
  it('returns default window when no input', () => {
    const result = resolveStudyPlannerTargetWindow({});
    expect(result.weeksUntilTarget).toBe(30);
    expect(result.bufferDays).toBe(1);
    expect(result.targetDateObj).toBeNull();
    expect(result.adjustedTargetDate).toBeNull();
  });

  it('returns default window when targetDate is null', () => {
    const result = resolveStudyPlannerTargetWindow({ targetDate: null });
    expect(result.weeksUntilTarget).toBe(30);
  });

  it('returns default window when targetDate is "No tengo fecha específica"', () => {
    const result = resolveStudyPlannerTargetWindow({
      targetDate: 'No tengo fecha específica',
      studyApproach: 'balance',
    });
    expect(result.weeksUntilTarget).toBe(30);
    expect(result.targetDateObj).toBeNull();
  });

  it('returns 4 weeks when approach present but date cannot be parsed', () => {
    const result = resolveStudyPlannerTargetWindow({
      targetDate: 'garbage date',
      studyApproach: 'corto',
    });
    expect(result.weeksUntilTarget).toBe(4);
  });

  it('calculates weeks from far future date (≥8 weeks → bufferDays=3)', () => {
    const farFuture = new Date();
    farFuture.setDate(farFuture.getDate() + 70); // ~10 weeks
    const iso = farFuture.toISOString().split('T')[0];
    const result = resolveStudyPlannerTargetWindow({
      targetDate: iso,
      studyApproach: 'balance',
    });
    expect(result.bufferDays).toBe(3);
    expect(result.weeksUntilTarget).toBeGreaterThanOrEqual(8);
    expect(result.weeksUntilTarget).toBeLessThanOrEqual(52);
    expect(result.adjustedTargetDate).not.toBeNull();
  });

  it('calculates bufferDays=2 for dates 4-7 weeks away', () => {
    const midFuture = new Date();
    midFuture.setDate(midFuture.getDate() + 35); // ~5 weeks
    const iso = midFuture.toISOString().split('T')[0];
    const result = resolveStudyPlannerTargetWindow({
      targetDate: iso,
      studyApproach: 'corto',
    });
    expect(result.bufferDays).toBe(2);
  });

  it('calculates bufferDays=1 for dates < 4 weeks away', () => {
    const nearFuture = new Date();
    nearFuture.setDate(nearFuture.getDate() + 14); // 2 weeks
    const iso = nearFuture.toISOString().split('T')[0];
    const result = resolveStudyPlannerTargetWindow({
      targetDate: iso,
      studyApproach: 'largo',
    });
    expect(result.bufferDays).toBe(1);
    expect(result.weeksUntilTarget).toBe(2);
  });

  it('caps weeksUntilTarget at 52', () => {
    const veryFarFuture = new Date();
    veryFarFuture.setFullYear(veryFarFuture.getFullYear() + 2); // 2 years
    const iso = veryFarFuture.toISOString().split('T')[0];
    const result = resolveStudyPlannerTargetWindow({
      targetDate: iso,
      studyApproach: 'balance',
    });
    expect(result.weeksUntilTarget).toBe(52);
  });

  it('adjustedTargetDate is bufferDays before targetDateObj', () => {
    const future = new Date();
    future.setDate(future.getDate() + 70);
    const iso = future.toISOString().split('T')[0];
    const result = resolveStudyPlannerTargetWindow({
      targetDate: iso,
      studyApproach: 'balance',
    });
    if (result.targetDateObj && result.adjustedTargetDate) {
      const diff = result.targetDateObj.getTime() - result.adjustedTargetDate.getTime();
      const diffDays = diff / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(result.bufferDays);
    }
  });

  it('minimum weeksUntilTarget is 1', () => {
    // Date is today (0 days diff → max(1, ceil(0/7)) = 1)
    const today = new Date();
    const iso = today.toISOString().split('T')[0];
    const result = resolveStudyPlannerTargetWindow({
      targetDate: iso,
      studyApproach: 'corto',
    });
    expect(result.weeksUntilTarget).toBeGreaterThanOrEqual(1);
  });
});
