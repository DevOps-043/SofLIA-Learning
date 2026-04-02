import { describe, it, expect } from 'vitest';
import {
  getUserDisplayName,
  roundToSingleDecimal,
  getFilteredUserIds,
} from '../report-data/shared';
import type { ReportFilters } from '../../types/report-data.types';

// ─── getUserDisplayName ───────────────────────────────────────────────────────

describe('getUserDisplayName', () => {
  it('returns display_name when available', () => {
    const user = {
      display_name: 'Alice Smith',
      first_name: 'Alice',
      last_name: 'Smith',
      username: 'asmith',
      email: 'alice@example.com',
    };
    expect(getUserDisplayName(user)).toBe('Alice Smith');
  });

  it('returns first_name + last_name when no display_name', () => {
    const user = {
      display_name: null,
      first_name: 'Bob',
      last_name: 'Jones',
      username: 'bjones',
      email: 'bob@example.com',
    };
    expect(getUserDisplayName(user)).toBe('Bob Jones');
  });

  it('returns only first_name when last_name is missing', () => {
    const user = {
      display_name: null,
      first_name: 'Carlos',
      last_name: null,
      username: 'carlos',
      email: 'carlos@example.com',
    };
    expect(getUserDisplayName(user)).toBe('Carlos');
  });

  it('returns username when no name parts available', () => {
    const user = {
      display_name: null,
      first_name: null,
      last_name: null,
      username: 'jane_doe',
      email: 'jane@example.com',
    };
    expect(getUserDisplayName(user)).toBe('jane_doe');
  });

  it('returns email when no display_name, name, or username', () => {
    const user = {
      display_name: null,
      first_name: null,
      last_name: null,
      username: null,
      email: 'fallback@example.com',
    };
    expect(getUserDisplayName(user)).toBe('fallback@example.com');
  });

  it('returns "Usuario desconocido" for empty/null user', () => {
    expect(getUserDisplayName(null)).toBe('Usuario desconocido');
    expect(getUserDisplayName({})).toBe('Usuario desconocido');
  });

  it('returns "Usuario desconocido" when all fields are null/empty', () => {
    const user = {
      display_name: null,
      first_name: null,
      last_name: null,
      username: null,
      email: null,
    };
    expect(getUserDisplayName(user)).toBe('Usuario desconocido');
  });

  it('trims whitespace from combined first+last name', () => {
    const user = { display_name: null, first_name: 'Maria', last_name: '' };
    const result = getUserDisplayName(user);
    expect(result).not.toMatch(/^\s|\s$/);
  });

  it('display_name takes priority over everything else', () => {
    const user = {
      display_name: 'Priority Name',
      first_name: 'Other',
      last_name: 'Name',
      username: 'oname',
      email: 'other@example.com',
    };
    expect(getUserDisplayName(user)).toBe('Priority Name');
  });
});

// ─── roundToSingleDecimal ─────────────────────────────────────────────────────

describe('roundToSingleDecimal', () => {
  it('rounds to 1 decimal place', () => {
    expect(roundToSingleDecimal(1.23)).toBe(1.2);
    expect(roundToSingleDecimal(1.25)).toBe(1.3);
    expect(roundToSingleDecimal(1.26)).toBe(1.3);
  });

  it('handles integer values', () => {
    expect(roundToSingleDecimal(5)).toBe(5);
  });

  it('handles negative values', () => {
    expect(roundToSingleDecimal(-1.75)).toBe(-1.7);
  });

  it('handles zero', () => {
    expect(roundToSingleDecimal(0)).toBe(0);
  });

  it('handles values already at 1 decimal', () => {
    expect(roundToSingleDecimal(3.5)).toBe(3.5);
  });

  it('returns accurate single decimal for percentages', () => {
    // 33.33... → 33.3
    expect(roundToSingleDecimal(100 / 3)).toBe(33.3);
  });
});

// ─── getFilteredUserIds ───────────────────────────────────────────────────────

describe('getFilteredUserIds', () => {
  const allUserIds = ['u1', 'u2', 'u3', 'u4', 'u5'];
  const buildFilters = (userIds?: string[]): Pick<ReportFilters, 'user_ids'> => ({ user_ids: userIds });

  it('returns all ids when filters.user_ids is empty', () => {
    const result = getFilteredUserIds(allUserIds, buildFilters([]));
    expect(result).toEqual(allUserIds);
  });

  it('returns all ids when filters.user_ids is undefined', () => {
    const result = getFilteredUserIds(allUserIds, buildFilters());
    expect(result).toEqual(allUserIds);
  });

  it('filters to only specified user ids', () => {
    const result = getFilteredUserIds(allUserIds, buildFilters(['u1', 'u3']));
    expect(result).toEqual(['u1', 'u3']);
  });

  it('returns empty array when no matching ids', () => {
    const result = getFilteredUserIds(allUserIds, buildFilters(['u99', 'u100']));
    expect(result).toEqual([]);
  });

  it('handles empty organizationUserIds', () => {
    const result = getFilteredUserIds([], buildFilters(['u1']));
    expect(result).toEqual([]);
  });

  it('preserves order from organizationUserIds', () => {
    const result = getFilteredUserIds(['u5', 'u3', 'u1'], buildFilters(['u5', 'u1', 'u3']));
    expect(result).toEqual(['u5', 'u3', 'u1']);
  });

  it('deduplicates: only includes each org id once even if filter has duplicates', () => {
    const result = getFilteredUserIds(['u1', 'u2'], buildFilters(['u1', 'u1', 'u2']));
    expect(result).toHaveLength(2);
  });
});
