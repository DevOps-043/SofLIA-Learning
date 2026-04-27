import { describe, expect, it } from 'vitest';

import {
  canUseSunday,
  filterUnauthorizedSundayDays,
  hasSundayWorkBlock,
  userExplicitlyAllowsSunday,
} from '../sunday-eligibility.service';

function date(value: string): Date {
  return new Date(`${value}T10:00:00`);
}

describe('sunday eligibility', () => {
  it('allows sunday when the user explicitly asks for it', () => {
    expect(userExplicitlyAllowsSunday('muevelo al domingo')).toBe(true);
    expect(userExplicitlyAllowsSunday('puedes usar mi domingo aunque sea descanso')).toBe(true);
    expect(userExplicitlyAllowsSunday('lunes a domingo por la manana')).toBe(true);
  });

  it('does not treat negative sunday mentions as permission', () => {
    expect(userExplicitlyAllowsSunday('no quiero domingo')).toBe(false);
    expect(userExplicitlyAllowsSunday('sin domingo, por favor')).toBe(false);
  });

  it('allows sunday when it has a work block', () => {
    const events = [
      {
        title: 'Trabajo',
        startTime: '2026-04-12T09:00:00',
        endTime: '2026-04-12T17:00:00',
      },
    ];

    expect(hasSundayWorkBlock(events)).toBe(true);
    expect(canUseSunday({ date: date('2026-04-12'), events })).toBe(true);
  });

  it('filters free sundays without explicit permission or work block', () => {
    const days = [
      { date: date('2026-04-12'), events: [] },
      { date: date('2026-04-13'), events: [] },
    ];

    expect(filterUnauthorizedSundayDays(days)).toEqual([days[1]]);
  });
});

