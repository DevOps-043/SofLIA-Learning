import { describe, it, expect } from 'vitest';
import {
  formatPlannerDisplayDate,
  buildFinalPlanSummaryContext,
  buildAddScheduleContext,
  buildChangeTargetDateContext,
} from '../planner-message-context.service';
import type { PlannerMessageContextParams } from '../planner-message-context.service';

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeParams = (overrides: Partial<PlannerMessageContextParams> = {}): PlannerMessageContextParams => ({
  availableCourses: [],
  selectedCourseIds: [],
  savedLessonDistribution: [],
  savedTargetDate: null,
  savedTotalLessons: 0,
  userType: 'b2c',
  savedCalendarData: null,
  ...overrides,
});

const makeLessonDistribution = (
  dateStr: string,
  dayName: string,
  lessons: string[],
) => ({
  dateStr,
  dayName,
  startTime: '09:00',
  endTime: '10:00',
  lessons: lessons.map((lessonTitle) => ({ lessonTitle })),
});

// ─── formatPlannerDisplayDate ─────────────────────────────────────────────────

describe('buildChangeTargetDateContext', () => {
  it('returns non-empty string', () => {
    const result = buildChangeTargetDateContext(makeParams());
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains CAMBIAR FECHA LIMITE instruction', () => {
    const result = buildChangeTargetDateContext(makeParams());
    expect(result).toContain('CAMBIAR FECHA LIMITE');
  });

  it('mentions maintaining existing schedules', () => {
    const result = buildChangeTargetDateContext(makeParams());
    expect(result).toContain('MANTENER');
  });

  it('shows existing schedules with lessons', () => {
    const distribution = [makeLessonDistribution('2025-07-15', 'martes', ['Advanced Module'])];
    const params = makeParams({ savedLessonDistribution: distribution });
    const result = buildChangeTargetDateContext(params);
    expect(result).toContain('Advanced Module');
  });

  it('includes instructions for changing date', () => {
    const result = buildChangeTargetDateContext(makeParams());
    expect(result).toContain('INSTRUCCIONES PARA CAMBIAR FECHA LIMITE');
  });

  it('shows sessions count', () => {
    const distribution = [
      makeLessonDistribution('2025-07-01', 'lunes', ['L1']),
      makeLessonDistribution('2025-07-03', 'miércoles', ['L2', 'L3']),
    ];
    const params = makeParams({ savedLessonDistribution: distribution, savedTotalLessons: 3 });
    const result = buildChangeTargetDateContext(params);
    expect(result).toContain('Total de sesiones: 2');
  });

  it('shows pending lessons count', () => {
    const distribution = [makeLessonDistribution('2025-07-01', 'lunes', ['L1', 'L2'])];
    const params = makeParams({
      savedLessonDistribution: distribution,
      savedTotalLessons: 10,
    });
    const result = buildChangeTargetDateContext(params);
    // 10 total - 2 assigned = 8 pending
    expect(result).toContain('8');
  });
});
