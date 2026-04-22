import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  STUDY_PLANNER_WEEKDAY_NAMES,
} from '../study-planner-calendar.constants';
import {
  buildMonthDays,
  buildWeekDays,
  buildWeekRange,
} from '../study-planner-calendar.utils';

describe('study-planner-calendar.utils', () => {
  it('builds weekly ranges from sunday to saturday', () => {
    const referenceDate = new Date('2026-04-22T12:00:00.000Z');
    const weekRange = buildWeekRange(referenceDate);
    const weekDays = buildWeekDays(referenceDate);

    expect(format(weekRange.start, 'yyyy-MM-dd')).toBe('2026-04-19');
    expect(format(weekRange.end, 'yyyy-MM-dd')).toBe('2026-04-25');
    expect(weekDays.map((day) => format(day, 'yyyy-MM-dd'))).toEqual([
      '2026-04-19',
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
      '2026-04-23',
      '2026-04-24',
      '2026-04-25',
    ]);
  });

  it('builds month grids with sunday as the first column', () => {
    const monthDays = buildMonthDays(
      new Date('2026-04-15T12:00:00.000Z'),
      new Date('2026-04-21T12:00:00.000Z'),
    );

    expect(STUDY_PLANNER_WEEKDAY_NAMES).toEqual([
      'Dom',
      'Lun',
      'Mar',
      'Mie',
      'Jue',
      'Vie',
      'Sab',
    ]);
    expect(format(monthDays[0]!.date, 'yyyy-MM-dd')).toBe('2026-03-29');
  });
});
