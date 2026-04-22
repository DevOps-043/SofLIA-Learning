import { format } from 'date-fns';
import { describe, expect, it } from 'vitest';

import {
  buildWeekDays,
  buildWeekRange,
} from '../schedule-preview-data.service';

describe('schedule-preview-data.service', () => {
  it('builds preview weeks from sunday to saturday', () => {
    const weekRange = buildWeekRange(new Date('2026-04-22T12:00:00.000Z'));
    const weekDays = buildWeekDays(weekRange.start);

    expect(format(weekRange.start, 'yyyy-MM-dd')).toBe('2026-04-19');
    expect(weekRange.end.toISOString()).toBe('2026-04-25T23:59:59.999Z');
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
});
