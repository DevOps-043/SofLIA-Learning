import { describe, expect, it } from 'vitest';
import { DESIGN_HEX_COLOR } from '@/core/theme/color-tokens';
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
    expect(style.primary_button_color).toBe(DESIGN_HEX_COLOR.info);
    expect(style.sidebar_opacity).toBe(1);
  });

  it('parses and rebuilds gradient styles', () => {
    const parsed = parseGradientStyleValue(
      `linear-gradient(120deg, ${DESIGN_HEX_COLOR.black} 0%, ${DESIGN_HEX_COLOR.gray800} 100%)`
    );

    expect(parsed).toEqual({
      angle: 120,
      colors: [DESIGN_HEX_COLOR.black, DESIGN_HEX_COLOR.gray800],
    });
    expect(buildGradientCss([DESIGN_HEX_COLOR.black, DESIGN_HEX_COLOR.gray800], 120)).toBe(
      `linear-gradient(120deg, ${DESIGN_HEX_COLOR.black} 0%, ${DESIGN_HEX_COLOR.gray800} 100%)`
    );
  });

  it('validates colors and theme matches', () => {
    expect(isValidHexColor(DESIGN_HEX_COLOR.info)).toBe(true);
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
        panel: { background_value: `linear-gradient(0deg, ${DESIGN_HEX_COLOR.black}, ${DESIGN_HEX_COLOR.bgLight})` } as never,
      } as never)
    ).toContain(DESIGN_HEX_COLOR.amber400);
  });
});
