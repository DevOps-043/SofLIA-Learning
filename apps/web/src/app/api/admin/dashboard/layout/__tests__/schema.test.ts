import { describe, expect, it } from 'vitest';

import { adminDashboardLayoutSchema } from '../schema';

const validWidget = {
  id: 'stats-cards',
  position: { h: 2, w: 12, x: 0, y: 0 },
  type: 'stats',
};

describe('adminDashboardLayoutSchema', () => {
  it('accepts a valid dashboard layout payload', () => {
    const result = adminDashboardLayoutSchema.safeParse({
      is_default: true,
      layout_config: { widgets: [validWidget] },
      name: 'Mi Dashboard Personalizado',
    });

    expect(result.success).toBe(true);
  });

  it('rejects blank layout names', () => {
    const result = adminDashboardLayoutSchema.safeParse({
      layout_config: { widgets: [validWidget] },
      name: '   ',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid widget positions', () => {
    const result = adminDashboardLayoutSchema.safeParse({
      layout_config: {
        widgets: [{ ...validWidget, position: { h: 0, w: 12, x: 0, y: 0 } }],
      },
      name: 'Mi Dashboard Personalizado',
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown fields', () => {
    const result = adminDashboardLayoutSchema.safeParse({
      layout_config: { widgets: [validWidget] },
      name: 'Mi Dashboard Personalizado',
      userId: 'not-allowed',
    });

    expect(result.success).toBe(false);
  });
});
