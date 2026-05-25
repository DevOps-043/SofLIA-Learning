import { describe, expect, it, vi } from 'vitest';
import {
  buildStudyPlannerEntryPath,
  fetchStudyPlanStatus,
  getModernNavbarColors,
} from '../service';

describe('modern-navbar.service', () => {
  it('builds light theme colors from style config', () => {
    const colors = getModernNavbarColors(
      {
        primary_button_color: 'var(--color-legacy-112233)',
        accent_color: 'var(--color-legacy-44aa88)',
        sidebar_background: 'var(--color-legacy-102030)',
        sidebar_opacity: 0.5,
      } as never,
      'light'
    );

    expect(colors.primary).toBe('var(--color-legacy-112233)');
    expect(colors.accent).toBe('var(--color-legacy-44aa88)');
    expect(colors.navBg).toBe('rgba(255, 255, 255, 0.5)');
    expect(colors.isLightMode).toBe(true);
  });

  it('returns false when study plan status request fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network'));

    await expect(fetchStudyPlanStatus(fetchMock)).resolves.toBe(false);
  });

  it('returns plan status from api response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hasPlan: true }),
    });

    await expect(fetchStudyPlanStatus(fetchMock)).resolves.toBe(true);
  });

  it('requests study plan status scoped to the current organization slug', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hasPlan: false }),
    });

    await fetchStudyPlanStatus(fetchMock, 'board-ready');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/study-planner/status?orgSlug=board-ready',
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: 'application/json' }),
      }),
    );
  });

  it('builds planner links with source organization context', () => {
    expect(
      buildStudyPlannerEntryPath({
        hasStudyPlan: true,
        organizationSlug: 'board-ready',
      }),
    ).toBe('/study-planner/dashboard?fromOrg=board-ready');
  });
});
