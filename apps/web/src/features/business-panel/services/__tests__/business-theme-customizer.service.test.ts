import { describe, expect, it } from 'vitest';
import {
  buildGradientCss,
  getBusinessThemeIcon,
  getBusinessThemePreview,
  getDefaultBusinessStyle,
  isValidHexColor,
  matchesBusinessTheme,
  parseGradientStyleValue,
} from '../business-theme-customizer.service';

describe('business-theme-customizer.service', () => {
  it('returns the default style contract', () => {
    const style = getDefaultBusinessStyle();

    expect(style.background_type).toBe('gradient');
    expect(style.primary_button_color).toBe('#3b82f6');
    expect(style.sidebar_opacity).toBe(1);
  });

  it('parses and rebuilds gradient styles', () => {
    const parsed = parseGradientStyleValue('linear-gradient(120deg, #111111 0%, #222222 100%)');

    expect(parsed).toEqual({
      angle: 120,
      colors: ['#111111', '#222222'],
    });
    expect(buildGradientCss(['#111111', '#222222'], 120)).toBe(
      'linear-gradient(120deg, #111111 0%, #222222 100%)'
    );
  });

  it('validates colors and theme matches', () => {
    expect(isValidHexColor('#abc123')).toBe(true);
    expect(isValidHexColor('abc123')).toBe(false);
    expect(matchesBusinessTheme('SOFLIA-claro', 'SOFLIA')).toBe(true);
    expect(matchesBusinessTheme('premium-dorado', 'SOFLIA')).toBe(false);
  });

  it('returns theme icon and preview fallback', () => {
    expect(getBusinessThemeIcon('branding-personalizado')).toBe('*');
    expect(
      getBusinessThemePreview({
        id: 'branding-personalizado',
        name: 'Branding',
        description: 'desc',
        panel: { background_value: 'linear-gradient(0deg, #000, #fff)' } as never,
      } as never)
    ).toContain('#fbbf24');
  });
});
