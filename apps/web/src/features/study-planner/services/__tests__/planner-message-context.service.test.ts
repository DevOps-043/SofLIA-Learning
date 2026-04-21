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

describe('formatPlannerDisplayDate', () => {
  it('formats valid date with January', () => {
    const result = formatPlannerDisplayDate('2025-01-15', 'miércoles');
    expect(result).toBe('Miércoles 15 de enero de 2025');
  });

  it('formats valid date with December', () => {
    const result = formatPlannerDisplayDate('2025-12-25', 'jueves');
    expect(result).toBe('Jueves 25 de diciembre de 2025');
  });

  it('formats valid date with June', () => {
    const result = formatPlannerDisplayDate('2026-06-01', 'lunes');
    expect(result).toBe('Lunes 1 de junio de 2026');
  });

  it('capitalizes day name', () => {
    const result = formatPlannerDisplayDate('2025-03-10', 'lunes');
    expect(result).toContain('Lunes');
  });

  it('includes correct month name for each month', () => {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
    ];
    months.forEach((month, idx) => {
      const mm = String(idx + 1).padStart(2, '0');
      const result = formatPlannerDisplayDate(`2025-${mm}-01`, 'lunes');
      expect(result).toContain(month);
    });
  });

  it('falls back to dayName + dateStr for invalid format', () => {
    const result = formatPlannerDisplayDate('not-a-date', 'martes');
    expect(result).toContain('martes');
    expect(result).toContain('not-a-date');
  });

  it('includes year in output', () => {
    const result = formatPlannerDisplayDate('2030-04-20', 'viernes');
    expect(result).toContain('2030');
  });
});

// ─── buildFinalPlanSummaryContext ─────────────────────────────────────────────

describe('buildFinalPlanSummaryContext', () => {
  it('returns non-empty string', () => {
    const result = buildFinalPlanSummaryContext(makeParams());
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains RESUMEN DEL PLAN DE ESTUDIOS header', () => {
    const result = buildFinalPlanSummaryContext(makeParams());
    expect(result).toContain('RESUMEN DEL PLAN DE ESTUDIOS');
  });

  it('contains selected course title', () => {
    const params = makeParams({
      availableCourses: [{ id: 'c1', title: 'Machine Learning Basics' } as any],
      selectedCourseIds: ['c1'],
    });
    const result = buildFinalPlanSummaryContext(params);
    expect(result).toContain('Machine Learning Basics');
  });

  it('shows target date when provided', () => {
    const params = makeParams({ savedTargetDate: '2025-12-31' });
    const result = buildFinalPlanSummaryContext(params);
    expect(result).toContain('2025-12-31');
  });

  it('shows "No especificada" when target date is null', () => {
    const result = buildFinalPlanSummaryContext(makeParams({ savedTargetDate: null }));
    expect(result).toContain('No especificada');
  });

  it('includes REGLA ABSOLUTA SOBRE LA FECHA LIMITE when date is set', () => {
    const params = makeParams({ savedTargetDate: '2025-06-30' });
    const result = buildFinalPlanSummaryContext(params);
    expect(result).toContain('REGLA ABSOLUTA SOBRE LA FECHA LIMITE');
  });

  it('does not include REGLA ABSOLUTA when no target date', () => {
    const result = buildFinalPlanSummaryContext(makeParams({ savedTargetDate: null }));
    expect(result).not.toContain('REGLA ABSOLUTA SOBRE LA FECHA LIMITE');
  });

  it('shows lesson distribution info', () => {
    const distribution = [makeLessonDistribution('2025-07-01', 'martes', ['Lesson A'])];
    const params = makeParams({
      savedLessonDistribution: distribution,
      savedTotalLessons: 1,
    });
    const result = buildFinalPlanSummaryContext(params);
    expect(result).toContain('DISTRIBUCION DE LECCIONES');
    expect(result).toContain('Lesson A');
  });

  it('shows total sessions count', () => {
    const distribution = [
      makeLessonDistribution('2025-07-01', 'martes', ['L1']),
      makeLessonDistribution('2025-07-02', 'miércoles', ['L2']),
    ];
    const params = makeParams({ savedLessonDistribution: distribution, savedTotalLessons: 2 });
    const result = buildFinalPlanSummaryContext(params);
    expect(result).toContain('Total de sesiones: 2');
  });

  it('shows ALERTA CRITICA for b2b when lessons unassigned', () => {
    const params = makeParams({
      userType: 'b2b',
      savedTotalLessons: 10,
      savedLessonDistribution: [],
    });
    const result = buildFinalPlanSummaryContext(params);
    expect(result).toContain('ALERTA CRITICA');
  });

  it('shows regular message for b2c when lessons unassigned', () => {
    const params = makeParams({
      userType: 'b2c',
      savedTotalLessons: 5,
      savedLessonDistribution: [],
    });
    const result = buildFinalPlanSummaryContext(params);
    expect(result).not.toContain('ALERTA CRITICA');
    expect(result).toContain('Faltan');
  });

  it('shows completion message when all lessons assigned', () => {
    const distribution = [makeLessonDistribution('2025-07-01', 'martes', ['L1'])];
    const params = makeParams({
      savedLessonDistribution: distribution,
      savedTotalLessons: 1,
    });
    const result = buildFinalPlanSummaryContext(params);
    expect(result).toContain('Se completaran todas');
  });

  it('includes INSTRUCCIONES CRITICAS PARA EL RESUMEN section', () => {
    const result = buildFinalPlanSummaryContext(makeParams());
    expect(result).toContain('INSTRUCCIONES CRITICAS PARA EL RESUMEN');
  });

  it('excludes holiday dates from distribution', () => {
    // Christmas (2025-12-25) should be excluded
    const distribution = [makeLessonDistribution('2025-12-25', 'jueves', ['Holiday Lesson'])];
    const params = makeParams({ savedLessonDistribution: distribution, savedTotalLessons: 1 });
    const result = buildFinalPlanSummaryContext(params);
    // Holiday lesson should NOT appear in the schedule
    expect(result).not.toContain('Holiday Lesson');
  });
});

// ─── buildAddScheduleContext ──────────────────────────────────────────────────

describe('buildAddScheduleContext', () => {
  it('returns non-empty string', () => {
    const result = buildAddScheduleContext(makeParams());
    expect(result.length).toBeGreaterThan(0);
  });

  it('contains AGREGAR HORARIOS instruction', () => {
    const result = buildAddScheduleContext(makeParams());
    expect(result).toContain('AGREGAR HORARIOS');
  });

  it('mentions maintaining existing schedules', () => {
    const result = buildAddScheduleContext(makeParams());
    expect(result).toContain('MANTENER');
  });

  it('shows existing schedules with lessons', () => {
    const distribution = [makeLessonDistribution('2025-08-01', 'viernes', ['Intro Lesson'])];
    const params = makeParams({ savedLessonDistribution: distribution });
    const result = buildAddScheduleContext(params);
    expect(result).toContain('Intro Lesson');
  });

  it('shows validation section when calendarData is provided', () => {
    const params = makeParams({
      savedCalendarData: { '2025-08-01': [{ start: '09:00', end: '10:00' }] } as any,
    });
    const result = buildAddScheduleContext(params);
    expect(result).toContain('VALIDACION DE CONFLICTOS');
  });

  it('does not show validation section when calendarData is null', () => {
    const result = buildAddScheduleContext(makeParams({ savedCalendarData: null }));
    expect(result).not.toContain('VALIDACION DE CONFLICTOS');
  });

  it('shows target date when provided', () => {
    const params = makeParams({ savedTargetDate: '2025-09-30' });
    const result = buildAddScheduleContext(params);
    expect(result).toContain('2025-09-30');
    expect(result).toContain('FECHA LIMITE');
  });

  it('does not show FECHA LIMITE section when no target date', () => {
    const result = buildAddScheduleContext(makeParams({ savedTargetDate: null }));
    expect(result).not.toContain('FECHA LIMITE');
  });

  it('includes INSTRUCCIONES CRITICAS PARA TU RESPUESTA', () => {
    const result = buildAddScheduleContext(makeParams());
    expect(result).toContain('INSTRUCCIONES CRITICAS PARA TU RESPUESTA');
  });

  it('shows pending lessons count', () => {
    const distribution = [makeLessonDistribution('2025-07-01', 'lunes', ['L1'])];
    const params = makeParams({
      savedLessonDistribution: distribution,
      savedTotalLessons: 5,
    });
    const result = buildAddScheduleContext(params);
    // 5 total - 1 assigned = 4 pending
    expect(result).toContain('4');
  });
});

// ─── buildChangeTargetDateContext ─────────────────────────────────────────────

