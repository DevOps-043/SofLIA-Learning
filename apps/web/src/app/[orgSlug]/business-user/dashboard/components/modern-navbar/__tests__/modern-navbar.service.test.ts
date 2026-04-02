import { describe, expect, it, vi } from 'vitest';
import { fetchStudyPlanStatus, getModernNavbarColors } from '../service';

describe('modern-navbar.service', () => {
  it('builds light theme colors from style config', () => {
    const colors = getModernNavbarColors(
      {
        primary_button_color: '#112233',
        accent_color: '#44AA88',
        sidebar_background: '#102030',
        sidebar_opacity: 0.5,
      } as never,
      'light'
    );

    expect(colors.primary).toBe('#112233');
    expect(colors.accent).toBe('#44AA88');
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
});
